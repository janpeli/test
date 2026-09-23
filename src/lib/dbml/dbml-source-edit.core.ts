// Pure helpers that edit a .dbml file's SOURCE TEXT for schema-level settings
// a user changes through the diagram UI (currently: a table's header color) —
// as opposed to dbml-layout-file.core.ts, which persists purely visual state
// (positions, collapsed groups) to the sidecar file instead. headercolor is a
// real DBML table setting (dbdiagram.io-compatible), so it belongs in the
// source, not the sidecar — that keeps it portable to any other DBML tool.
//
// No monaco/app/store imports, so this can be unit-tested in isolation (see
// CLAUDE.md "*.core.ts" convention).

import { resolveTable } from "./dbml-source-info.core";
import type { DbmlSchema, QualifiedName } from "./dbml-parser.core";

const HEX_COLOR_RE = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;

// Captures: 1) "Table <name>" (name quoted or bare, optionally schema-qualified)
// 2) an optional " as alias" clause  3) an optional "[ ...settings... ]"
// 4) everything from the opening "{" onward (kept verbatim).
const TABLE_HEADER_LINE_RE =
  /^(\s*Table\s+(?:"[^"]+"|[\w.]+))(\s+as\s+(?:"[^"]+"|[\w]+))?(?:\s*\[([^\]]*)\])?(\s*\{.*)$/i;

/**
 * Sets (or clears, with `color: null`) a table's `headercolor` setting by
 * editing its `Table ... {` header line in place — preserving any other
 * settings already on that line. A no-op (returns `content` unchanged) if
 * the table can't be found, or `color` isn't a valid `#rgb`/`#rrggbb` hex
 * string (defensive: never write malformed DBML into the file).
 */
export function setTableHeaderColor(
  content: string,
  schema: DbmlSchema,
  targetTableName: QualifiedName,
  color: string | null
): string {
  if (color !== null && !HEX_COLOR_RE.test(color)) return content;

  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]!;
    // CRLF files keep a trailing "\r" on every line after splitting on "\n"
    // alone; strip it before matching (regex `.`/`$` don't span it) and
    // restore it on the rewritten line so the file's EOL style is preserved.
    const hasCR = rawLine.endsWith("\r");
    const line = hasCR ? rawLine.slice(0, -1) : rawLine;
    const match = TABLE_HEADER_LINE_RE.exec(line);
    if (!match) continue;

    const rawName = match[1]!.replace(/^\s*Table\s+/i, "");
    const table = resolveTable(schema, rawName);
    if (!table || table.name !== targetTableName) continue;

    const [, prefix, asClause = "", existingSettings = "", suffix] = match;
    const items = existingSettings
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !/^headercolor\s*:/i.test(s));
    if (color !== null) items.push(`headercolor: ${color}`);

    const bracket = items.length > 0 ? ` [${items.join(", ")}]` : "";
    lines[i] = `${prefix}${asClause}${bracket}${suffix}${hasCR ? "\r" : ""}`;
    return lines.join("\n");
  }

  return content;
}
