// Pure helpers backing the Monaco hover/completion providers for .dbml files
// (see monaco-dbml-language.ts) — no monaco-editor import, so this can be
// unit-tested in isolation (see CLAUDE.md "*.core.ts" convention).
//
// These deliberately work by lightweight text scanning rather than needing
// source positions out of @dbml/core's parse tree: "which table's body is
// line N inside of" is enough to resolve hover/completion for plain DBML
// (no !include, so everything is in one file/model).

import type { DbmlColumn, DbmlSchema, DbmlTable } from "./dbml-parser.core";

const TABLE_HEADER_RE = /^\s*Table\s+(?:"([^"]+)"|([\w.]+))/i;

/**
 * Maps each 1-indexed line number to the raw (as-written, possibly
 * unqualified or quoted) table name whose body it falls inside — including
 * the "Table X {" header line itself. Lines outside any table body are
 * absent from the map. Tracks brace depth so a nested block (e.g.
 * `indexes { ... }`) doesn't end the table body early.
 */
export function buildLineTableMap(content: string): Map<number, string> {
  const map = new Map<number, string>();
  const lines = content.split("\n");
  let depth = 0;
  let inTable = false;
  let tableBodyDepth = 0;
  let currentTable = "";

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    const opens = (line.match(/\{/g) ?? []).length;
    const closes = (line.match(/\}/g) ?? []).length;

    const header = !inTable ? TABLE_HEADER_RE.exec(line) : null;
    if (header) {
      currentTable = header[1] ?? header[2] ?? "";
      inTable = true;
      tableBodyDepth = depth + opens;
      map.set(lineNo, currentTable);
    } else if (inTable) {
      map.set(lineNo, currentTable);
    }

    depth += opens - closes;
    if (inTable && depth < tableBodyDepth) inTable = false;
  });

  return map;
}

/** Resolves a raw (as-written) table name against the schema's own table list. */
export function resolveTable(schema: DbmlSchema, rawName: string): DbmlTable | undefined {
  const clean = rawName.replace(/["`]/g, "");
  if (clean.includes(".")) {
    return schema.tables.find((t) => t.name === clean);
  }
  return schema.tables.find((t) => t.tableName === clean || t.name === clean);
}

export type SymbolAtPosition =
  | { kind: "table"; table: DbmlTable }
  | { kind: "column"; table: DbmlTable; column: DbmlColumn };

/**
 * What `word` (the identifier under the cursor, from Monaco's
 * `getWordAtPosition`) refers to on the given line — a column of the
 * enclosing table, or a table referenced anywhere (its own header, or a
 * `Ref:`/inline `ref:` target).
 */
export function findSymbolAtPosition(
  schema: DbmlSchema,
  lineTableMap: Map<number, string>,
  lineNumber: number,
  word: string
): SymbolAtPosition | null {
  const enclosingRaw = lineTableMap.get(lineNumber);
  if (enclosingRaw) {
    const table = resolveTable(schema, enclosingRaw);
    const column = table?.columns.find((c) => c.name === word);
    if (table && column) return { kind: "column", table, column };
  }

  const table = resolveTable(schema, word);
  if (table) return { kind: "table", table };

  return null;
}

export function formatColumnFlags(column: DbmlColumn): string {
  const flags: string[] = [];
  if (column.pk) flags.push("PK");
  if (column.notNull) flags.push("NOT NULL");
  if (column.unique) flags.push("UNIQUE");
  if (column.increment) flags.push("AUTO INCREMENT");
  return flags.join(", ");
}

/** Markdown hover content for a table or column symbol (Monaco's `IMarkdownString.value`). */
export function formatHoverMarkdown(symbol: SymbolAtPosition): string {
  if (symbol.kind === "table") {
    const lines = [`**${symbol.table.tableName}** _(${symbol.table.schemaName})_`];
    if (symbol.table.note) lines.push(symbol.table.note);
    lines.push(`${symbol.table.columns.length} column${symbol.table.columns.length === 1 ? "" : "s"}`);
    return lines.join("\n\n");
  }
  const flags = formatColumnFlags(symbol.column);
  const lines = [
    `**${symbol.column.name}**: \`${symbol.column.type}\`${flags ? ` — ${flags}` : ""}`,
    `on **${symbol.table.tableName}**`,
  ];
  if (symbol.column.default != null) lines.push(`default: \`${symbol.column.default}\``);
  if (symbol.column.note) lines.push(symbol.column.note);
  return lines.join("\n\n");
}

/* ----- Completion context detection ----- */

export type CompletionContext =
  | { kind: "line-start" } // suggest top-level keywords (Table, Ref, Enum, TableGroup)
  | { kind: "column-settings" } // inside a column's [ ... ] — suggest pk/unique/etc
  | { kind: "ref-target"; prefix: string } // after "> "/"< "/"- " inside a ref clause — suggest table names
  | { kind: "table-dot"; tableRawName: string } // right after "tablename." — suggest its columns
  | { kind: "column-type" } // after a column name at the start of a table-body line — suggest types
  | { kind: "none" };

const REF_TARGET_RE = /(?:^|\s)(?:Ref\s*:|ref\s*:)?\s*[<>-]\s*([\w."`]*)$/i;
const TABLE_DOT_RE = /([\w"`]+)\.([\w"`]*)$/;

/**
 * Classifies what completion should offer at `linePrefix` (the current
 * line's text up to the cursor — Monaco calls the provider on every
 * keystroke, so this must handle a partially-typed token, not just clean
 * boundaries like "right after a space"). `insideTableBody` distinguishes a
 * bare "colname " at column-position from a top-level line.
 */
export function getCompletionContext(
  linePrefix: string,
  insideTableBody: boolean
): CompletionContext {
  const trimmed = linePrefix.trim();

  // A dot-completion ("tablename.") always wins regardless of where it
  // appears — inside a settings bracket, on a standalone Ref: line, etc.
  const dotMatch = TABLE_DOT_RE.exec(linePrefix);
  if (dotMatch) return { kind: "table-dot", tableRawName: dotMatch[1]! };

  // Inside an open [ ... ] on this line (naive: no closing ] yet after the
  // last [ — good enough since settings blocks don't span lines in DBML).
  const lastOpenBracket = linePrefix.lastIndexOf("[");
  const lastCloseBracket = linePrefix.lastIndexOf("]");
  const insideBrackets = lastOpenBracket > lastCloseBracket;

  const refMatch = REF_TARGET_RE.exec(linePrefix);
  if (refMatch && (insideBrackets || /^ref\s*:/i.test(trimmed))) {
    return { kind: "ref-target", prefix: refMatch[1] ?? "" };
  }

  if (insideBrackets) return { kind: "column-settings" };

  if (!insideTableBody) {
    return /^[\w]*$/.test(trimmed) ? { kind: "line-start" } : { kind: "none" };
  }

  // "colname" then whitespace then (optionally) the type being typed. Trims
  // only the leading indentation here — `trimmed` above has also lost any
  // trailing space, which is exactly the boundary this pattern needs to see.
  if (/^[\w"`]+\s+[\w]*$/.test(linePrefix.replace(/^\s+/, ""))) {
    return { kind: "column-type" };
  }

  return { kind: "none" };
}

export const DBML_KEYWORDS = ["Table", "Ref", "Enum", "TableGroup", "Project", "Note"] as const;

export const DBML_COLUMN_TYPES = [
  "int",
  "integer",
  "bigint",
  "smallint",
  "tinyint",
  "varchar",
  "char",
  "text",
  "boolean",
  "bool",
  "date",
  "datetime",
  "timestamp",
  "time",
  "decimal",
  "numeric",
  "float",
  "double",
  "real",
  "uuid",
  "json",
  "jsonb",
  "blob",
  "binary",
  "enum",
] as const;

export const DBML_COLUMN_SETTINGS = [
  "pk",
  "primary key",
  "not null",
  "null",
  "unique",
  "increment",
  "default:",
  "note:",
  "ref:",
] as const;
