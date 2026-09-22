import { useRef } from "react";

// Shared pointer-capture drag math for the DBML pane: table cards and group
// headers both drag the same way (report a scale-aware delta from the
// pointer-down origin, live while dragging, once more on release). The pan/
// zoom view lives in a ref in dbml-editor.tsx (mutated directly on the DOM,
// not through React state — see canvas-editor.tsx's pan/zoom for the same
// pattern), so the delta math must read the CURRENT scale from the ref at
// move time, not a value snapshotted at render time.
type ViewRef = React.MutableRefObject<{ scale: number; x: number; y: number }>;

export function useDragDelta(
  viewRef: ViewRef,
  onMove: (dx: number, dy: number) => void,
  onEnd: (dx: number, dy: number) => void
) {
  const origin = useRef<{ startX: number; startY: number } | null>(null);

  const delta = (e: React.PointerEvent): { dx: number; dy: number } | null => {
    const o = origin.current;
    if (!o) return null;
    const scale = viewRef.current.scale || 1;
    return { dx: (e.clientX - o.startX) / scale, dy: (e.clientY - o.startY) / scale };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    // Stop the pan/zoom viewport underneath from also starting a canvas pan.
    e.stopPropagation();
    e.preventDefault();
    origin.current = { startX: e.clientX, startY: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const d = delta(e);
    if (d) onMove(d.dx, d.dy);
  };

  const endDrag = (e: React.PointerEvent<HTMLElement>) => {
    const d = delta(e);
    origin.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (d) onEnd(d.dx, d.dy);
  };

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };
}
