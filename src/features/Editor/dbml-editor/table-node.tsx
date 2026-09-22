import { useRef } from "react";
import { KeyRound, Link2 } from "lucide-react";
import type { DbmlTable } from "@/lib/dbml/dbml-parser.core";
import {
  TABLE_HEADER_HEIGHT,
  TABLE_ROW_HEIGHT,
  TABLE_WIDTH,
  contrastTextColor,
  visibleColumns,
} from "@/lib/dbml/dbml-layout.core";
import type { TablePosition } from "@/lib/dbml/dbml-layout.core";
import { useDragDelta } from "./use-drag-delta";

type TableNodeProps = {
  table: DbmlTable;
  position: TablePosition;
  fkColumns: Set<string>;
  // When true, only PK/FK columns are rendered (see visibleColumns — a ref's
  // columns are always either the PK or the FK side, so this never hides an
  // edge's anchor column).
  showOnlyPkFk: boolean;
  // Search highlight: null when no search is active, otherwise whether this
  // table matches — non-matches render dimmed rather than being hidden.
  matchesSearch: boolean | null;
  viewRef: React.MutableRefObject<{ scale: number; x: number; y: number }>;
  // Fired continuously while dragging, with the delta from drag-start, so
  // ref lines can track live.
  onDragMove: (tableName: string, dx: number, dy: number) => void;
  // Fired once on release, with the final delta, so the caller persists it.
  onDragEnd: (tableName: string, dx: number, dy: number) => void;
  // Fired when the header color swatch changes — edits the table's own
  // `[headercolor: ...]` DBML source setting (see dbml-source-edit.core.ts).
  onHeaderColorChange: (tableName: string, color: string) => void;
};

function TableNode({
  table,
  position,
  fkColumns,
  showOnlyPkFk,
  matchesSearch,
  viewRef,
  onDragMove,
  onDragEnd,
  onHeaderColorChange,
}: TableNodeProps) {
  const columns = visibleColumns(table, fkColumns, showOnlyPkFk);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const drag = useDragDelta(
    viewRef,
    (dx, dy) => onDragMove(table.name, dx, dy),
    (dx, dy) => onDragEnd(table.name, dx, dy)
  );

  const headerTextColor = table.headerColor ? contrastTextColor(table.headerColor) : null;

  return (
    <div
      className="absolute rounded-md border border-border bg-card shadow-sm text-[11px] transition-opacity"
      style={{
        left: position.x,
        top: position.y,
        width: TABLE_WIDTH,
        opacity: matchesSearch === false ? 0.35 : 1,
      }}
    >
      <div
        className="flex items-center gap-1 px-2 font-semibold border-b border-border truncate cursor-grab active:cursor-grabbing select-none"
        style={{
          height: TABLE_HEADER_HEIGHT,
          backgroundColor: table.headerColor ?? undefined,
          color: headerTextColor ?? undefined,
        }}
        title={table.name}
        {...drag}
      >
        <span className={`truncate flex-1 ${headerTextColor ? "" : "text-card-foreground"}`}>
          {table.tableName}
        </span>
        <button
          type="button"
          className="h-3 w-3 shrink-0 rounded-full border border-current/40"
          style={{ backgroundColor: table.headerColor ?? "transparent" }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            colorInputRef.current?.click();
          }}
          title="Table header color"
        />
        <input
          ref={colorInputRef}
          type="color"
          value={table.headerColor ?? "#94a3b8"}
          onChange={(e) => onHeaderColorChange(table.name, e.target.value)}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
      <div>
        {columns.map((col) => (
          <div
            key={col.name}
            className="flex items-center gap-1.5 px-2 border-b border-border/50 last:border-b-0"
            style={{ height: TABLE_ROW_HEIGHT }}
            title={col.note ?? undefined}
          >
            {col.pk ? (
              <KeyRound className="h-3 w-3 shrink-0 text-amber-500" />
            ) : fkColumns.has(col.name) ? (
              <Link2 className="h-3 w-3 shrink-0 text-muted-foreground" />
            ) : (
              <span className="w-3 shrink-0" />
            )}
            <span className="truncate flex-1">{col.name}</span>
            <span className="truncate text-muted-foreground">{col.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TableNode;
