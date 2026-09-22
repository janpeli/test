// Pure helpers for the DBML diagram's sidecar layout file — no app/store/
// Electron imports, so this can be unit-tested in isolation (see CLAUDE.md
// "*.core.ts" convention). The file persists user-dragged table positions,
// collapsed groups, and view settings (e.g. "keys only") next to the .dbml
// source (e.g. "schema.dbml.layout.json") so they survive reopening the
// file/app restart, git-friendly (sorted keys, integer coords, omitted
// defaults).

export interface DbmlTableLayout {
  x: number;
  y: number;
}

export interface DbmlGroupLayout {
  collapsed?: boolean;
}

export interface DbmlViewSettings {
  showOnlyPkFk?: boolean;
}

export interface DbmlLayoutFile {
  version: 1;
  tables: Record<string, DbmlTableLayout>;
  groups?: Record<string, DbmlGroupLayout>;
  viewSettings?: DbmlViewSettings;
}

export function emptyDbmlLayoutFile(): DbmlLayoutFile {
  return { version: 1, tables: {} };
}

/** The sidecar file's project-relative path for a given .dbml file's id/path. */
export function sidecarPathFor(dbmlFileId: string): string {
  return `${dbmlFileId}.layout.json`;
}

export function parseDbmlLayoutFile(text: string): DbmlLayoutFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return emptyDbmlLayoutFile();
  }
  if (!raw || typeof raw !== "object") return emptyDbmlLayoutFile();
  const r = raw as Record<string, unknown>;
  const result: DbmlLayoutFile = { version: 1, tables: toTables(r.tables) };
  const groups = toGroups(r.groups);
  if (groups) result.groups = groups;
  const viewSettings = toViewSettings(r.viewSettings);
  if (viewSettings) result.viewSettings = viewSettings;
  return result;
}

function toTables(raw: unknown): Record<string, DbmlTableLayout> {
  const out: Record<string, DbmlTableLayout> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== "object") continue;
    const vv = v as Record<string, unknown>;
    const x = numeric(vv.x);
    const y = numeric(vv.y);
    if (x === null || y === null) continue;
    out[k] = { x, y };
  }
  return out;
}

// Absent/false entries are dropped entirely — the git-friendly file only ever
// records a group when it's actually collapsed.
function toGroups(raw: unknown): Record<string, DbmlGroupLayout> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: Record<string, DbmlGroupLayout> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== "object") continue;
    if ((v as Record<string, unknown>).collapsed === true) out[k] = { collapsed: true };
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function toViewSettings(raw: unknown): DbmlViewSettings | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  return r.showOnlyPkFk === true ? { showOnlyPkFk: true } : undefined;
}

function numeric(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.round(n) : null;
}

/**
 * Git-friendly serialization: sorted keys, 2-space indent, integer coords,
 * one compact line per table/group, trailing newline. "groups" and
 * "viewSettings" are omitted entirely when there's nothing non-default to
 * record, so a plain layout (the common case) stays a single "tables" block.
 */
export function serializeDbmlLayoutFile(layout: DbmlLayoutFile): string {
  const tableKeys = Object.keys(layout.tables).sort();
  const groupKeys = Object.keys(layout.groups ?? {})
    .filter((k) => layout.groups![k]!.collapsed === true)
    .sort();
  const hasGroups = groupKeys.length > 0;
  const hasViewSettings = layout.viewSettings?.showOnlyPkFk === true;

  const lines: string[] = [];
  lines.push("{");
  lines.push(`  "version": ${layout.version},`);

  lines.push('  "tables": {');
  tableKeys.forEach((k, i) => {
    const v = layout.tables[k]!;
    const comma = i < tableKeys.length - 1 ? "," : "";
    lines.push(
      `    ${JSON.stringify(k)}: { "x": ${Math.round(v.x)}, "y": ${Math.round(v.y)} }${comma}`
    );
  });
  lines.push(hasGroups || hasViewSettings ? "  }," : "  }");

  if (hasGroups) {
    lines.push('  "groups": {');
    groupKeys.forEach((k, i) => {
      const comma = i < groupKeys.length - 1 ? "," : "";
      lines.push(`    ${JSON.stringify(k)}: { "collapsed": true }${comma}`);
    });
    lines.push(hasViewSettings ? "  }," : "  }");
  }

  if (hasViewSettings) {
    lines.push('  "viewSettings": { "showOnlyPkFk": true }');
  }

  lines.push("}");
  lines.push("");
  return lines.join("\n");
}
