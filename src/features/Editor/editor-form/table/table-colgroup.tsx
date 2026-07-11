import { UTILITY_COL_WIDTH } from "./column-resize.core";

/**
 * Emits one <col> per rendered column (leading expand col when nested
 * fields exist, one per data column, trailing delete col), giving the
 * `table-layout: fixed` table its widths in a single, header/row-agnostic
 * place. `columnWidths` are the fully resolved px widths (type defaults
 * layered with user resize overrides — see `resolveColumnWidths`), computed
 * once in table.tsx which also pins the <table> width to their sum.
 */
export default function TableColgroup({
  columnWidths,
  hasExpandColumn,
}: {
  columnWidths: number[];
  hasExpandColumn: boolean;
}) {
  return (
    <colgroup>
      {hasExpandColumn ? (
        <col style={{ width: `${UTILITY_COL_WIDTH}px` }} />
      ) : null}
      {columnWidths.map((width, index) => (
        <col key={index} style={{ width: `${width}px` }} />
      ))}
      <col style={{ width: `${UTILITY_COL_WIDTH}px` }} />
    </colgroup>
  );
}
