import React from "react";

interface VerticalResizeHandleProps {
  onMouseDown: React.MouseEventHandler;
  onDoubleClick?: React.MouseEventHandler;
}

export const VerticalResizeHandle: React.FC<VerticalResizeHandleProps> = ({
  onMouseDown,
  onDoubleClick,
}) => {
  return (
    <div
      className="w-1 bg-transparent hover:bg-blue-500 cursor-col-resize flex-shrink-0 border-r hover:border-none"
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize editor panels"
      title="Drag to resize · double-click to even out"
    />
  );
};
