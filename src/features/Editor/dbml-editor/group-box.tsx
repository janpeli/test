import { ChevronDown, ChevronRight } from "lucide-react";
import { GROUP_HEADER_HEIGHT, TABLE_WIDTH, type ContentBounds } from "@/lib/dbml/dbml-layout.core";
import { useDragDelta } from "./use-drag-delta";

// Below this, a pointer-down/up gesture on the header is treated as a click
// (toggle collapse) rather than a drag — lets a near-motionless click still
// register cleanly instead of committing a no-op position write.
const DRAG_CLICK_THRESHOLD_PX = 3;

type GroupBoxProps = {
  name: string;
  bounds: ContentBounds;
  collapsed: boolean;
  tableCount: number;
  viewRef: React.MutableRefObject<{ scale: number; x: number; y: number }>;
  onToggleCollapse: (name: string) => void;
  // Dragging the header moves every member table together, by the same
  // delta — see dbml-editor.tsx's handleGroupDragMove/End.
  onDragMove: (name: string, dx: number, dy: number) => void;
  onDragEnd: (name: string, dx: number, dy: number) => void;
};

// Rendered before the table cards in DOM order so it sits behind them without
// needing an explicit z-index. Collapsed groups render as a compact bar at
// the box's top-left corner instead of the full (padded) bounding box — their
// member tables aren't rendered at all while collapsed (see dbml-editor.tsx).
function GroupBox({
  name,
  bounds,
  collapsed,
  tableCount,
  viewRef,
  onToggleCollapse,
  onDragMove,
  onDragEnd,
}: GroupBoxProps) {
  const box = collapsed
    ? { left: bounds.minX, top: bounds.minY, width: TABLE_WIDTH, height: GROUP_HEADER_HEIGHT }
    : { left: bounds.minX, top: bounds.minY, width: bounds.width, height: bounds.height };

  // A single pointer gesture is either a click (toggle) or a drag (move the
  // group) — decided by how far it actually moved, not by a separate native
  // click handler, so a real drag can never also fire the toggle.
  const drag = useDragDelta(
    viewRef,
    (dx, dy) => onDragMove(name, dx, dy),
    (dx, dy) => {
      if (Math.abs(dx) < DRAG_CLICK_THRESHOLD_PX && Math.abs(dy) < DRAG_CLICK_THRESHOLD_PX) {
        onToggleCollapse(name);
      } else {
        onDragEnd(name, dx, dy);
      }
    }
  );

  return (
    <div
      className="absolute rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20"
      style={box}
    >
      <div
        className="absolute left-1 top-0.5 flex cursor-grab select-none items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground active:cursor-grabbing truncate"
        style={{ maxWidth: box.width - 8 }}
        title={collapsed ? "Click to expand, drag to move" : "Click to collapse, drag to move"}
        {...drag}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronDown className="h-3 w-3 shrink-0" />
        )}
        <span className="truncate">
          {name}
          {collapsed ? ` (${tableCount})` : ""}
        </span>
      </div>
    </div>
  );
}

export default GroupBox;
