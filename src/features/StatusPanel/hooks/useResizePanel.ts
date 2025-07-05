// src\features\StatusPanel\hooks\useResizePanel.ts
import { useState, useRef, MouseEventHandler } from "react";

const DEFAULT_INITIAL_HEIGHT = 500;
const DEFAULT_MIN_HEIGHT = 100;
const DEFAULT_MAX_HEIGHT_OFFSET = 400;
const DEFAULT_RESIZE_STEP = 20;

export const useResizePanel = (
  initialHeight: number = DEFAULT_INITIAL_HEIGHT
) => {
  const [panelHeight, setPanelHeight] = useState(initialHeight);
  const panelRef = useRef<HTMLDivElement>(null);

  const resizeMouseDownHandler: MouseEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const y = e.clientY;
    const panelStyle = panelRef.current
      ? window.getComputedStyle(panelRef.current)
      : null;
    const initialHeight = panelStyle
      ? parseInt(panelStyle.height, 10)
      : DEFAULT_INITIAL_HEIGHT;

    const mouseMoveHandler = (e: MouseEvent) => {
      const dy = y - e.clientY; // Resize from top
      const newHeight = initialHeight + dy;
      const maxHeight = window.innerHeight - DEFAULT_MAX_HEIGHT_OFFSET;

      if (newHeight <= maxHeight && newHeight >= DEFAULT_MIN_HEIGHT) {
        setPanelHeight(newHeight);
      }
    };

    const mouseUpHandler = () => {
      document.removeEventListener("mouseup", mouseUpHandler);
      document.removeEventListener("mousemove", mouseMoveHandler);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  };

  const handleKeyboardResize = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const step = DEFAULT_RESIZE_STEP;
      const newHeight =
        e.key === "ArrowUp"
          ? Math.min(
              panelHeight + step,
              window.innerHeight - DEFAULT_MAX_HEIGHT_OFFSET
            )
          : Math.max(panelHeight - step, DEFAULT_MIN_HEIGHT);
      setPanelHeight(newHeight);
    }
  };

  return {
    panelHeight,
    panelRef,
    resizeMouseDownHandler,
    handleKeyboardResize,
  };
};
