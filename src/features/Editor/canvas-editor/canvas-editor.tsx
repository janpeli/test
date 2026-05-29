import { useCallback, useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import {
  selectOpenFileContent,
  selectOpenFileId,
} from "@/API/editor-api/editor-api.selectors";
import { insertObjectIntoCanvas } from "@/lib/products/canvas-insert";
import { Button } from "@/components/ui/button";
import { getCanvasView, setCanvasView } from "@/lib/canvas/canvas-view-store";

// dataTransfer key set by the treeview when dragging an object (node-controller).
const MODEL_OBJECT_MIME = "application/x-model-object";

const MIN_SCALE = 0.1;
const MAX_SCALE = 10;
const ZOOM_STEP = 1.1;

const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

let instanceCounter = 0;

type CanvasEditorProps = {
  editorIdx: number;
};

function CanvasEditor({ editorIdx }: CanvasEditorProps) {
  const content = useAppSelectorWithParams(selectOpenFileContent, { editorIdx });
  const fileId = useAppSelectorWithParams(selectOpenFileId, { editorIdx });
  const viewportRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceId = useRef(`mermaid-${++instanceCounter}`);
  const renderSeq = useRef(0);

  // Pan/zoom state lives in a ref and is written straight to the DOM so wheel
  // ticks and pointer moves don't trigger React re-renders.
  const view = useRef({ scale: 1, x: 0, y: 0 });
  // Track the file id without re-creating callbacks; lets us key viewStore.
  const fileIdRef = useRef(fileId);
  fileIdRef.current = fileId;
  const prevFileId = useRef<string | undefined>(undefined);

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const mermaidTheme = isDark ? "dark" : "default";

  const applyTransform = useCallback(() => {
    if (!transformRef.current) return;
    const { scale, x, y } = view.current;
    transformRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    if (fileIdRef.current) setCanvasView(fileIdRef.current, { scale, x, y });
  }, []);

  // Reset the view so the rendered SVG is scaled to fit and centered.
  const fitToView = useCallback(() => {
    const viewport = viewportRef.current;
    const svg = containerRef.current?.querySelector("svg");
    if (!viewport || !svg) return;

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const sw = svg.clientWidth || svg.getBoundingClientRect().width;
    const sh = svg.clientHeight || svg.getBoundingClientRect().height;
    if (!sw || !sh) return;

    const scale = clampScale(Math.min(vw / sw, vh / sh, 1) * 0.95);
    view.current = {
      scale,
      x: (vw - sw * scale) / 2,
      y: (vh - sh * scale) / 2,
    };
    applyTransform();
  }, [applyTransform]);

  // Zoom keeping the point (cx, cy) — relative to the viewport — fixed.
  const zoomAt = useCallback(
    (factor: number, cx: number, cy: number) => {
      const { scale, x, y } = view.current;
      const newScale = clampScale(scale * factor);
      if (newScale === scale) return;
      view.current = {
        scale: newScale,
        x: cx - (cx - x) * (newScale / scale),
        y: cy - (cy - y) * (newScale / scale),
      };
      applyTransform();
    },
    [applyTransform]
  );

  const zoomFromCenter = (factor: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    zoomAt(factor, viewport.clientWidth / 2, viewport.clientHeight / 2);
  };

  // Native non-passive wheel listener: React's onWheel is passive so it can't
  // preventDefault the page scroll.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      zoomAt(factor, e.clientX - rect.left, e.clientY - rect.top);
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: mermaidTheme, securityLevel: "loose" });
    if (!containerRef.current) return;

    // Decide synchronously (before the async render) whether this run is a file
    // switch: if so we restore the saved view, otherwise (a source edit on the
    // same file) we re-fit. Updating prevFileId here — not inside the async
    // callback — keeps it correct even when a render fails or returns early.
    const restoreView = prevFileId.current !== fileId;
    prevFileId.current = fileId;

    const trimmed = content?.trim();
    if (!trimmed) {
      containerRef.current.innerHTML = "";
      return;
    }

    const seq = ++renderSeq.current;
    const renderId = `${instanceId.current}-${seq}`;

    mermaid
      .render(renderId, trimmed)
      .then(({ svg }) => {
        if (containerRef.current && renderSeq.current === seq) {
          containerRef.current.innerHTML = svg;
          const saved = fileId ? getCanvasView(fileId) : undefined;
          if (restoreView && saved) {
            view.current = { ...saved };
            applyTransform();
          } else {
            fitToView();
          }
        }
      })
      .catch(() => {
        if (containerRef.current && renderSeq.current === seq) {
          containerRef.current.innerHTML =
            '<p style="padding:1rem;color:#f87171;font-size:0.875rem">Invalid diagram syntax</p>';
        }
      });
  }, [content, mermaidTheme, fileId, fitToView, applyTransform]);

  // Click-drag panning via pointer capture.
  const drag = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: view.current.x,
      origY: view.current.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.style.cursor = "grabbing";
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    view.current.x = drag.current.origX + (e.clientX - drag.current.startX);
    view.current.y = drag.current.origY + (e.clientY - drag.current.startY);
    applyTransform();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    e.currentTarget.style.cursor = "grab";
  };

  // Drop target for objects dragged from the treeview: render the object's
  // basic product and append it to the canvas content.
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes(MODEL_OBJECT_MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const objectId = e.dataTransfer.getData(MODEL_OBJECT_MIME);
    if (!objectId || !fileId) return;
    e.preventDefault();
    void insertObjectIntoCanvas(objectId, fileId);
  };

  return (
    <div
      ref={viewportRef}
      className="relative flex-1 overflow-hidden bg-background"
      style={{ cursor: "grab" }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div ref={transformRef} style={{ transformOrigin: "0 0" }}>
        <div ref={containerRef} />
      </div>

      <div
        className="absolute bottom-4 right-4 z-10 flex flex-col gap-1"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Button
          variant="outline"
          size="icon"
          title="Zoom in"
          onClick={() => zoomFromCenter(ZOOM_STEP)}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          title="Zoom out"
          onClick={() => zoomFromCenter(1 / ZOOM_STEP)}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          title="Reset view"
          onClick={fitToView}
        >
          <Maximize className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default CanvasEditor;
