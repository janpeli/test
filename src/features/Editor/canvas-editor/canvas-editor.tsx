import { useEffect, useRef } from "react";
import mermaid from "mermaid";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import { selectOpenFileContent } from "@/API/editor-api/editor-api.selectors";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
});

let instanceCounter = 0;

type CanvasEditorProps = {
  editorIdx: number;
};

function CanvasEditor({ editorIdx }: CanvasEditorProps) {
  const content = useAppSelectorWithParams(selectOpenFileContent, { editorIdx });
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceId = useRef(`mermaid-${++instanceCounter}`);
  const renderSeq = useRef(0);

  useEffect(() => {
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
  }, [content]);

  return (
    <div className="flex-1 overflow-auto flex items-start justify-center p-6 bg-background">
      <div ref={containerRef} className="max-w-full" />
    </div>
  );
}

export default CanvasEditor;
