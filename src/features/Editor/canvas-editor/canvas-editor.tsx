import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import {
  selectOpenFileContent,
  selectOpenFileId,
} from "@/API/editor-api/editor-api.selectors";
import { insertObjectIntoCanvas } from "@/lib/products/canvas-insert";

// dataTransfer key set by the treeview when dragging an object (node-controller).
const MODEL_OBJECT_MIME = "application/x-model-object";

let instanceCounter = 0;

type CanvasEditorProps = {
  editorIdx: number;
};

function CanvasEditor({ editorIdx }: CanvasEditorProps) {
  const content = useAppSelectorWithParams(selectOpenFileContent, { editorIdx });
  const fileId = useAppSelectorWithParams(selectOpenFileId, { editorIdx });
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceId = useRef(`mermaid-${++instanceCounter}`);
  const renderSeq = useRef(0);

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

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: mermaidTheme, securityLevel: "loose" });
    if (!containerRef.current) return;
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
          const svgEl = containerRef.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.maxWidth = "100%";
            svgEl.style.height = "auto";
          }
        }
      })
      .catch(() => {
        if (containerRef.current && renderSeq.current === seq) {
          containerRef.current.innerHTML =
            '<p style="padding:1rem;color:#f87171;font-size:0.875rem">Invalid diagram syntax</p>';
        }
      });
  }, [content, mermaidTheme]);

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
      className="flex-1 overflow-auto flex items-start justify-center p-6 bg-background"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div ref={containerRef} className="max-w-full" />
    </div>
  );
}

export default CanvasEditor;
