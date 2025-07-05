// src\features\StatusPanel\status-panel.tsx
import { useAppSelector } from "@/hooks/hooks";
import { selectShowStatusPanel } from "@/API/GUI-api/status-panel.slice";

import { ResizeHandle } from "./components/resize-handle";

import { PanelContent } from "./components/panel-content";
import { useResizePanel } from "./hooks/useResizePanel";
import { TabNavigation } from "./components/tab-navigation";

export default function StatusPanel() {
  const showPanel = useAppSelector(selectShowStatusPanel);

  const {
    panelHeight,
    panelRef,
    resizeMouseDownHandler,
    handleKeyboardResize,
  } = useResizePanel(500);

  if (!showPanel) return null;

  return (
    <div
      ref={panelRef}
      className="bg-background border-t border-border flex flex-col"
      style={{ height: `${panelHeight}px` }}
      role="region"
      aria-label="Status panel"
    >
      <ResizeHandle
        onMouseDown={resizeMouseDownHandler}
        onKeyDown={handleKeyboardResize}
      />

      <TabNavigation />

      <PanelContent />
    </div>
  );
}
