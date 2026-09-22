// Pure wrapper over @dbml/core's Parser — no app/store/Electron imports, so
// this can be unit-tested in isolation (see CLAUDE.md "*.core.ts" convention).
// Input: standard DBML source. Output: our own plain-data Schema, shaped for
// the DBML diagram editor (dbml-editor.tsx) rather than @dbml/core's own
// export format.

import { Parser } from "@dbml/core";

export type QualifiedName = string; // e.g. "public.users"

export type RefEndpointRelation = "1" | "*"; // one or many

export interface DbmlColumn {
  name: string;
  type: string;
  pk?: boolean;
  notNull?: boolean;
  unique?: boolean;
  increment?: boolean;
  default?: string | null;
  note?: string | null;
}

export interface DbmlTable {
  name: QualifiedName;
  schemaName: string;
  tableName: string;
  columns: DbmlColumn[];
  note?: string | null;
  groupName?: string | null;
  // From the table's own `[headercolor: #RRGGBB]` setting, if any.
  headerColor?: string | null;
}

export interface DbmlRef {
  id: string; // stable hash of endpoints
  source: { table: QualifiedName; columns: string[]; relation: RefEndpointRelation };
  target: { table: QualifiedName; columns: string[]; relation: RefEndpointRelation };
  name?: string | null;
}

export interface DbmlTableGroup {
  name: string;
  tables: QualifiedName[];
  note?: string | null;
}

export interface DbmlSchema {
  tables: DbmlTable[];
  refs: DbmlRef[];
  groups: DbmlTableGroup[];
}

export interface DbmlParseError {
  message: string;
  line?: number;
  column?: number;
}

export type DbmlParseResult =
  | { schema: DbmlSchema; error: null }
  | { schema: null; error: DbmlParseError };

export function parseDbml(source: string): DbmlParseResult {
  try {
    const db = Parser.parse(source, "dbmlv2");
    const exported = db.export() as unknown as ExportedDatabase;
    return { schema: mapExportedToSchema(exported), error: null };
  } catch (err) {
    return { schema: null, error: toParseError(err) };
  }
}

function toParseError(err: unknown): DbmlParseError {
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    const message = typeof e.message === "string" ? e.message : String(err);
    const diags = (e.diags ?? e.diagnostics) as unknown;
    if (Array.isArray(diags) && diags.length > 0) {
      const first = diags[0] as Record<string, unknown>;
      const loc = first.location as Record<string, unknown> | undefined;
      const start = loc?.start as Record<string, unknown> | undefined;
      return {
        message: typeof first.message === "string" ? first.message : message,
        line: typeof start?.line === "number" ? start.line : undefined,
        column: typeof start?.column === "number" ? start.column : undefined,
      };
    }
    return { message };
  }
  return { message: String(err) };
}

/* ----- @dbml/core's exported shape (the bits we read) ----- */

interface ExportedField {
  name: string;
  type: unknown;
  unique: boolean;
  pk: boolean;
  not_null: boolean;
  note: string;
  dbdefault: unknown;
  increment: boolean;
}

interface ExportedIndexColumn {
  value: string;
  type: "column" | "expression";
}

interface ExportedIndex {
  columns: ExportedIndexColumn[];
  pk: boolean;
  unique: boolean;
}

interface ExportedTable {
  fields: ExportedField[];
  indexes?: ExportedIndex[];
  name: string;
  alias: string | null;
  note: string;
  headerColor?: string | null;
}

interface ExportedRef {
  endpoints: Array<{
    schemaName: string | null;
    tableName: string;
    fieldNames: string[];
    relation: unknown;
  }>;
  name: string | null;
}

interface ExportedTableGroup {
  name: string;
  note?: string | null;
  tables: Array<{ schemaName: string | null; tableName: string }>;
}

interface ExportedSchema {
  name: string;
  tables: ExportedTable[];
  refs: ExportedRef[];
  tableGroups: ExportedTableGroup[];
}

interface ExportedDatabase {
  schemas: ExportedSchema[];
}

function unquote(s: string): string {
  if (!s) return s;
  const first = s.charAt(0);
  const last = s.charAt(s.length - 1);
  if (
    (first === '"' && last === '"') ||
    (first === "'" && last === "'") ||
    (first === "`" && last === "`")
  ) {
    return s.slice(1, -1);
  }
  return s;
}

function qualify(schemaName: string | null | undefined, tableName: string): QualifiedName {
  const s = unquote((schemaName ?? "").trim());
  const t = unquote(tableName.trim());
  return `${s && s.length > 0 ? s : "public"}.${t}`;
}

function mapExportedToSchema(db: ExportedDatabase): DbmlSchema {
  const tables: DbmlTable[] = [];
  const refs: DbmlRef[] = [];
  const groups: DbmlTableGroup[] = [];
  const tableToGroup = new Map<QualifiedName, string>();

  // Pass 1: build the complete tableToGroup map and groups list across ALL
  // schemas before assigning groupName to tables — @dbml/core may emit a
  // TableGroup in a different schema entry than the tables it references.
  for (const s of db.schemas) {
    const schemaName = s.name && s.name.length > 0 ? s.name : "public";
    for (const g of s.tableGroups ?? []) {
      const members: QualifiedName[] = [];
      for (const t of g.tables ?? []) {
        const q = qualify(t.schemaName ?? schemaName, t.tableName);
        members.push(q);
        tableToGroup.set(q, g.name);
      }
      members.sort();
      groups.push({ name: unquote(g.name), tables: members, note: g.note ?? null });
    }
  }

  // Pass 2: build tables now that tableToGroup is fully populated.
  for (const s of db.schemas) {
    const schemaName = s.name && s.name.length > 0 ? s.name : "public";

    for (const t of s.tables ?? []) {
      const cleanName = unquote(t.name);
      const qn = qualify(schemaName, cleanName);
      const pkIndexCols = new Set<string>();
      for (const idx of t.indexes ?? []) {
        if (idx.pk) {
          for (const c of idx.columns) {
            if (c.type === "column") pkIndexCols.add(unquote(c.value));
          }
        }
      }
      const columns = (t.fields ?? []).map((f) => {
        const col = mapField(f);
        return pkIndexCols.has(col.name) ? { ...col, pk: true } : col;
      });
      tables.push({
        name: qn,
        schemaName,
        tableName: cleanName,
        columns,
        note: t.note || null,
        groupName: tableToGroup.get(qn) ?? null,
        headerColor: t.headerColor || null,
      });
    }

    for (const r of s.refs ?? []) {
      const mapped = mapRef(r, schemaName);
      if (mapped) refs.push(mapped);
    }
  }

  tables.sort((a, b) => a.name.localeCompare(b.name));
  groups.sort((a, b) => a.name.localeCompare(b.name));

  return { tables, refs, groups };
}

function mapField(f: ExportedField): DbmlColumn {
  return {
    name: unquote(f.name),
    type: typeName(f.type),
    pk: f.pk || undefined,
    notNull: f.not_null || undefined,
    unique: f.unique || undefined,
    increment: f.increment || undefined,
    default:
      f.dbdefault != null
        ? String((f.dbdefault as { value?: unknown })?.value ?? f.dbdefault)
        : null,
    note: f.note || null,
  };
}

function typeName(t: unknown): string {
  if (typeof t === "string") return t;
  if (t && typeof t === "object") {
    const o = t as Record<string, unknown>;
    if (typeof o.type_name === "string") return o.type_name;
    if (typeof o.name === "string") return o.name;
  }
  return "unknown";
}

function mapRef(r: ExportedRef, defaultSchemaName: string): DbmlRef | null {
  if (!r.endpoints || r.endpoints.length !== 2) return null;
  const [a, b] = r.endpoints;
  if (!a || !b) return null;
  const source = {
    table: qualify(a.schemaName ?? defaultSchemaName, a.tableName),
    columns: a.fieldNames.map(unquote),
    relation: normalizeRelation(a.relation),
  };
  const target = {
    table: qualify(b.schemaName ?? defaultSchemaName, b.tableName),
    columns: b.fieldNames.map(unquote),
    relation: normalizeRelation(b.relation),
  };
  const id = stableRefId(source.table, source.columns, target.table, target.columns);
  return { id, source, target, name: r.name || null };
}

function normalizeRelation(rel: unknown): RefEndpointRelation {
  if (rel === "*" || rel === "many" || rel === ">") return "*";
  return "1";
}

/**
 * Maps each table to the set of its column names that physically hold a
 * foreign key — i.e. the "many" (`relation === "*"`) side of a Ref, which is
 * where @dbml/core (and DBML itself) puts the FK column. The "1" side is just
 * the referenced primary/unique key and isn't itself a foreign key.
 */
export function fkColumnsByTable(schema: DbmlSchema): Map<QualifiedName, Set<string>> {
  const result = new Map<QualifiedName, Set<string>>();
  const add = (table: QualifiedName, columns: string[]) => {
    const set = result.get(table) ?? new Set<string>();
    for (const c of columns) set.add(c);
    result.set(table, set);
  };
  for (const ref of schema.refs) {
    if (ref.source.relation === "*") add(ref.source.table, ref.source.columns);
    if (ref.target.relation === "*") add(ref.target.table, ref.target.columns);
  }
  return result;
}

function stableRefId(
  srcTable: string,
  srcCols: string[],
  tgtTable: string,
  tgtCols: string[]
): string {
  const a = `${srcTable}(${[...srcCols].sort().join(",")})`;
  const b = `${tgtTable}(${[...tgtCols].sort().join(",")})`;
  return a < b ? `${a}->${b}` : `${b}->${a}`;
}
