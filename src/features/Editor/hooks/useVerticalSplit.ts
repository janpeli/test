import { useRef, MouseEventHandler } from "react";
import { setSplitRatio } from "@/API/editor-api/editor-api";

const MIN_RATIO = 15;
const MAX_RATIO = 85;

export function useVerticalSplit(
  fileId: string | undefined,
  initialRatio: number = 50
) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown: MouseEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const container = containerRef.current;
    if (!container) return;

    const startX = e.clientX;
    const containerWidth = container.getBoundingClientRect().width;
    const startRatio = initialRatio;

    const onMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const newRatio = startRatio + (dx / containerWidth) * 100;
      const clamped = Math.min(MAX_RATIO, Math.max(MIN_RATIO, newRatio));
      if (fileId) setSplitRatio(fileId, clamped);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return { containerRef, handleMouseDown };
}
