// src\features\StatusPanel\components\resize-handle.tsx
import React from "react";

interface ResizeHandleProps {
  onMouseDown: React.MouseEventHandler;
  onKeyDown: React.KeyboardEventHandler;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  onMouseDown,
  onKeyDown,
}) => {
  return (
    <div
      className="h-1 bg-transparent hover:bg-blue-500 cursor-row-resize flex-shrink-0 border-t hover:border-none"
      onMouseDown={onMouseDown}
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize status panel"
      tabIndex={0}
      onKeyDown={onKeyDown}
    />
  );
};
