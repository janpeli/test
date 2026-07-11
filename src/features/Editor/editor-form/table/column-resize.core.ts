// Pure, dependency-free logic for user-resizable table columns.
//
// Kept free of any `@/…`/React/DOM imports so it can be unit-tested under
// Vitest in isolation (see CLAUDE.md's "*.core.ts" convention). Everything
// here is plain data: clamping, merging defaults with user overrides, and
// (de)serializing the localStorage payload.

/** Smallest width (px) a column may be dragged to. */
export const MIN_COLUMN_WIDTH = 60;

/** Largest width (px) a column may be dragged (or restored from storage) to. */
export const MAX_COLUMN_WIDTH = 1200;

/** Width (px) of the fixed expand/delete utility columns. */
export const UTILITY_COL_WIDTH = 36;

/** localStorage key prefix; the full key folds in the array field's stable
 * schema path (`zodKey`) so each object type's table remembers its own
 * widths. */
export const STORAGE_PREFIX = "editor-table-col-widths:";

export function storageKey(zodKey: string): string {
  return `${STORAGE_PREFIX}${zodKey}`;
}

/** Clamp a dragged pixel width to [min, max] and round to a whole pixel. */
export function clampColumnWidth(px: number): number {
  return Math.min(
    MAX_COLUMN_WIDTH,
    Math.max(MIN_COLUMN_WIDTH, Math.round(px))
  );
}

/**
 * Parse the stored JSON payload into a clean `{ [columnName]: px }` map.
 * Anything malformed (bad JSON, non-object, non-finite/non-number values)
 * is dropped rather than throwing — a corrupt entry must never break the
 * table. Callers still wrap the `localStorage.getItem` itself in try/catch.
 */
export function parseStoredWidths(raw: string | null): Record<string, number> {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      result[key] = clampColumnWidth(value);
    }
  }
  return result;
}

export function serializeWidths(widths: Record<string, number>): string {
  return JSON.stringify(widths);
}

/**
 * Resolve the final `<col>` width (px) for each column, layering user
 * overrides on top of the type-derived defaults. `columns` is an ordered
 * `[name, defaultWidth]` list where `defaultWidth` is a CSS px string; an
 * override (px number) wins over the default.
 */
export function resolveColumnWidths(
  columns: [string, string][],
  overrides: Record<string, number>
): number[] {
  return columns.map(([name, def]) =>
    overrides[name] !== undefined
      ? overrides[name]
      : Math.round(parseFloat(def)) || MIN_COLUMN_WIDTH
  );
}

/**
 * Total table width (px): every data column plus the fixed expand column
 * (when nested fields exist) and the trailing delete column. The table pins
 * its width to this sum so column widths are honored exactly — dragging a
 * boundary moves that boundary, nothing gets silently re-absorbed.
 */
export function totalTableWidth(
  columnWidths: number[],
  hasExpandColumn: boolean
): number {
  const utility = UTILITY_COL_WIDTH * (hasExpandColumn ? 2 : 1);
  return columnWidths.reduce((sum, w) => sum + w, utility);
}
