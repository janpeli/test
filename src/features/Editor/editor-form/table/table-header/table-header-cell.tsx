import { useRef } from "react";

export interface ColumnResizeCallbacks {
  /** Column name this cell resizes (the schema property name). */
  columnName: string;
  /** Live update as the handle is dragged (already-clamped px). */
  onResize: (columnName: string, width: number) => void;
  /** Drag finished — persist the current widths. */
  onResizeEnd: () => void;
  /** Double-click — drop the override, restoring the default width. */
  onReset: (columnName: string) => void;
}

interface TableHeaderCellProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** When present, renders a drag-to-resize handle on the cell's right edge. */
  resize?: ColumnResizeCallbacks;
}

/**
 * A grab strip pinned to the right edge of a header cell. Uses pointer
 * capture so move/up events keep targeting the handle even when the pointer
 * leaves it — no document-level listeners are attached, so nothing can be
 * left dangling. The starting width is read from the parent <th> at
 * pointer-down, so the handle needs no knowledge of the resolved width.
 */
function ResizeHandle({
  thRef,
  columnName,
  onResize,
  onResizeEnd,
  onReset,
}: ColumnResizeCallbacks & {
  thRef: React.RefObject<HTMLTableCellElement | null>;
}) {
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!thRef.current) return;
    // Don't let the click bubble into header sorting/selection or start a
    // text selection.
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = thRef.current.getBoundingClientRect().width;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    onResize(columnName, startWidth.current + (e.clientX - startX.current));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    onResizeEnd();
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${columnName} column`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onReset(columnName);
      }}
      className="absolute inset-y-0 right-0 z-10 w-1.5 cursor-col-resize touch-none select-none bg-transparent transition-colors hover:bg-ring/60 active:bg-ring"
    />
  );
}

export default function TableHeaderCell({
  resize,
  children,
  ...props
}: TableHeaderCellProps) {
  const thRef = useRef<HTMLTableCellElement>(null);

  return (
    <th
      ref={thRef}
      className="relative h-8 overflow-hidden px-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap text-ellipsis"
      {...props}
    >
      {children}
      {resize ? <ResizeHandle thRef={thRef} {...resize} /> : null}
    </th>
  );
}
