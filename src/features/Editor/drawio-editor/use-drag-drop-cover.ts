import { useEffect, useState } from "react";
import type { DragEvent as ReactDragEvent } from "react";

// dataTransfer key set by the treeview when dragging an object
// (node-controller.ts handleDragStart) — same constant canvas-editor.tsx
// checks for its own (non-iframe) drop target.
const MODEL_OBJECT_MIME = "application/x-model-object";

const isModelObjectDrag = (e: DragEvent) =>
  Array.from(e.dataTransfer?.types ?? []).includes(MODEL_OBJECT_MIME);

/**
 * Tracks whether a treeview object drag is currently in flight, for the
 * DRAWIO pane's drop target. The drawio iframe is a cross-origin
 * out-of-process frame that can paint — and, by the same mechanism, capture
 * input — above host-page DOM regardless of z-index (see
 * use-overlay-cover.ts, which visibility-hides frames for the same reason
 * rather than relying on z-index). A plain overlay `<div>` on top of the
 * live iframe is therefore not a reliable drop target: the caller must
 * visibility-hide the iframe for the duration of the drag and show a normal
 * host-DOM drop-zone in its place, which then legitimately receives
 * dragover/drop like any other element.
 *
 * `dragstart`/`dragend` are used (not per-container `dragenter`/`dragover`)
 * because the iframe fills the whole pane, leaving no host-DOM area to
 * detect the pointer entering it before it's already over the iframe.
 * Drags are sourced from the treeview, which lives in the host document, so
 * both events bubble to `window` normally.
 */
export function useDragDropCover(onDrop: (objectId: string) => void): {
  dragging: boolean;
  dropZoneProps: {
    onDragOver: (e: ReactDragEvent) => void;
    onDrop: (e: ReactDragEvent) => void;
  };
} {
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const handleDragStart = (e: DragEvent) => {
      if (isModelObjectDrag(e)) setDragging(true);
    };
    const handleDragEnd = () => setDragging(false);

    window.addEventListener("dragstart", handleDragStart);
    window.addEventListener("dragend", handleDragEnd);
    return () => {
      window.removeEventListener("dragstart", handleDragStart);
      window.removeEventListener("dragend", handleDragEnd);
    };
  }, []);

  const dropZoneProps = {
    onDragOver: (e: ReactDragEvent) => {
      if (e.dataTransfer.types.includes(MODEL_OBJECT_MIME)) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }
    },
    onDrop: (e: ReactDragEvent) => {
      const objectId = e.dataTransfer.getData(MODEL_OBJECT_MIME);
      setDragging(false);
      if (!objectId) return;
      e.preventDefault();
      onDrop(objectId);
    },
  };

  return { dragging, dropZoneProps };
}
