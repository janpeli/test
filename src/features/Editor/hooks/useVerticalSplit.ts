import { useRef } from "react";
import { setPaneSizes } from "@/API/editor-api/editor-api";
import { EditorModeType } from "@/API/editor-api/editor-api.slice";

// Approximate width consumed by one resize handle (w-1 + border-r). Subtracted
// from the container so a 1px mouse move maps to ~1px of pane movement.
const HANDLE_WIDTH = 5;
// A pane never shrinks below this; the dragged boundary stops here.
const MIN_PANE_PX = 80;

/**
 * Drives the horizontal split between the editor panes. Resizing a boundary
 * transfers flex-grow weight between the two adjacent panes only, so every
 * other pane keeps its width. Weights are persisted per file in `paneSizes`.
 */
export function useVerticalSplit(
  fileId: string | undefined,
  visibleViews: EditorModeType[],
  paneSizes: Partial<Record<EditorModeType, number>>
) {
  const containerRef = useRef<HTMLDivElement>(null);

  const weightOf = (view: EditorModeType) => paneSizes[view] ?? 1;

  // Returns a mousedown handler for the boundary between `leftView` and
  // `rightView` (their order in the visible row).
  const handleMouseDown =
    (leftView: EditorModeType, rightView: EditorModeType) =>
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const container = containerRef.current;
      if (!container || !fileId) return;

      const startX = e.clientX;
      const totalWeight = visibleViews.reduce((sum, v) => sum + weightOf(v), 0);
      const handles = Math.max(0, visibleViews.length - 1);
      const availableWidth =
        container.getBoundingClientRect().width - handles * HANDLE_WIDTH;
      if (availableWidth <= 0) return;

      const pxPerWeight = availableWidth / totalWeight;
      const startWL = weightOf(leftView);
      const startWR = weightOf(rightView);
      const pairWeight = startWL + startWR;
      const minWeight = MIN_PANE_PX / pxPerWeight;

      const onMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        let newWL = startWL + dx / pxPerWeight;
        // Keep both panes above the minimum; if the pair is too small for two
        // minimums, the clamp collapses to the midpoint.
        const lo = Math.min(minWeight, pairWeight / 2);
        const hi = Math.max(pairWeight - minWeight, pairWeight / 2);
        newWL = Math.min(hi, Math.max(lo, newWL));
        setPaneSizes(fileId, {
          [leftView]: newWL,
          [rightView]: pairWeight - newWL,
        });
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

  // Double-click a boundary to split its two panes evenly, preserving the pair's
  // combined width so neighbouring panes don't shift.
  const resetGap = (leftView: EditorModeType, rightView: EditorModeType) => {
    if (!fileId) return;
    const avg = (weightOf(leftView) + weightOf(rightView)) / 2;
    setPaneSizes(fileId, { [leftView]: avg, [rightView]: avg });
  };

  return { containerRef, handleMouseDown, resetGap };
}
