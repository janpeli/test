import { useMemo } from "react";
import type { DbmlSchema, QualifiedName } from "@/lib/dbml/dbml-parser.core";
import {
  TABLE_WIDTH,
  columnAnchorY,
  visibleColumns,
  type ContentBounds,
  type TablePosition,
} from "@/lib/dbml/dbml-layout.core";

type EdgeLayerProps = {
  schema: DbmlSchema;
  positions: Record<string, TablePosition>;
  bounds: ContentBounds;
  fkColumnsByTable: Map<QualifiedName, Set<string>>;
  showOnlyPkFk: boolean;
  // Refs touching a table hidden by a collapsed group aren't drawn — nothing
  // for them to visibly connect to.
  hiddenTableNames: Set<QualifiedName>;
};

// Ref lines are drawn as an SVG overlay sharing the same untransformed
// coordinate space as the table cards (both are absolutely positioned inside
// dbml-editor.tsx's pan/zoom transform div) — sized to the tables' own extent
// (not just their width/height) so a card that doesn't start at (0, 0) isn't
// clipped.
function EdgeLayer({
  schema,
  positions,
  bounds,
  fkColumnsByTable,
  showOnlyPkFk,
  hiddenTableNames,
}: EdgeLayerProps) {
  const tableByName = useMemo(
    () => new Map(schema.tables.map((t) => [t.name, t])),
    [schema.tables]
  );

  const width = bounds.minX + bounds.width;
  const height = bounds.minY + bounds.height;

  return (
    <svg
      className="absolute overflow-visible pointer-events-none"
      style={{ left: 0, top: 0, width, height }}
    >
      {schema.refs.map((ref) => {
        if (ref.source.table === ref.target.table) return null; // self-refs: not laid out, skip
        if (hiddenTableNames.has(ref.source.table) || hiddenTableNames.has(ref.target.table)) {
          return null;
        }
        const sourceTable = tableByName.get(ref.source.table);
        const targetTable = tableByName.get(ref.target.table);
        const sourcePos = positions[ref.source.table];
        const targetPos = positions[ref.target.table];
        if (!sourceTable || !targetTable || !sourcePos || !targetPos) return null;

        const sourceCols = visibleColumns(
          sourceTable,
          fkColumnsByTable.get(sourceTable.name) ?? new Set(),
          showOnlyPkFk
        );
        const targetCols = visibleColumns(
          targetTable,
          fkColumnsByTable.get(targetTable.name) ?? new Set(),
          showOnlyPkFk
        );
        const sourceY = sourcePos.y + columnAnchorY(sourceCols, ref.source.columns[0] ?? "");
        const targetY = targetPos.y + columnAnchorY(targetCols, ref.target.columns[0] ?? "");
        // Exit/enter from whichever side actually faces the other table.
        const exitRight = targetPos.x >= sourcePos.x;
        const sourceX = sourcePos.x + (exitRight ? TABLE_WIDTH : 0);
        const targetX = targetPos.x + (exitRight ? 0 : TABLE_WIDTH);

        const reach = Math.max(40, Math.abs(targetX - sourceX) / 2);
        const c1x = exitRight ? sourceX + reach : sourceX - reach;
        const c2x = exitRight ? targetX - reach : targetX + reach;

        return (
          <path
            key={ref.id}
            d={`M ${sourceX} ${sourceY} C ${c1x} ${sourceY}, ${c2x} ${targetY}, ${targetX} ${targetY}`}
            fill="none"
            strokeWidth={1.25}
            style={{ stroke: "hsl(var(--muted-foreground))" }}
          />
        );
      })}
    </svg>
  );
}

export default EdgeLayer;
