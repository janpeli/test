/**
 * Shared styling for inline-edit controls living inside a data-grid cell.
 * Strips the control's own border/shadow/radius so the table gridlines carry
 * the structure; a focus ring (inset) marks the cell being edited. Keeps the
 * dense 32px row height used across the table.
 */
export const inlineCellControl =
  "h-8 w-full rounded-none border-0 bg-transparent px-2.5 shadow-none " +
  "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring";

// `isTableColumn` now lives in `../column-sizing.core.ts` (pure, unit-tested)
// alongside `getTableColumns`/`getColumnSizing` so the column list and its
// sizing derive from one place. Re-exported here so existing imports of
// `./table-fields/utils` keep working.
export { isTableColumn } from "../column-sizing.core";
