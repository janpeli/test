// src/components/StatusPanel/StatusPanel.tsx
import { useState, useRef, MouseEventHandler } from "react";
import { useAppSelector } from "@/hooks/hooks";
import {
  selectShowStatusPanel,
  selectOutputList,
  selectErrorList,
  selectActiveList,
} from "@/API/GUI-api/status-panel.slice";
import { cn } from "@/lib/utils";
import {
  setActivePanel,
  toggleStatusPanel,
} from "@/API/GUI-api/status-panel-api";
import { X } from "lucide-react";

export default function StatusPanel() {
  const showPanel = useAppSelector(selectShowStatusPanel);
  const outputList = useAppSelector(selectOutputList);
  const errorList = useAppSelector(selectErrorList);
  const activeList = useAppSelector(selectActiveList);

  const [panelHeight, setPanelHeight] = useState(500);
  const panelRef = useRef<HTMLDivElement>(null);

  const resizeMouseDownHandler: MouseEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const y = e.clientY;
    const panelStyle = panelRef.current
      ? window.getComputedStyle(panelRef.current)
      : null;
    const initialHeight = panelStyle ? parseInt(panelStyle.height, 10) : 500;

    const mouseMoveHandler = (e: MouseEvent) => {
      const dy = y - e.clientY; // Resize from top
      const newHeight = initialHeight + dy;
      const maxHeight = window.innerHeight - 400;

      if (newHeight <= maxHeight && newHeight >= 100) {
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

  const handleTabClick = (tab: "Output" | "Error") => {
    setActivePanel(tab);
  };

  const getErrorMessageColor = (type: "info" | "warning" | "error") => {
    switch (type) {
      case "info":
        return "text-blue-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-foreground";
    }
  };

  if (!showPanel) return null;

  return (
    <div
      ref={panelRef}
      className="bg-background border-t border-border flex flex-col"
      style={{ height: `${panelHeight}px` }}
      role="region"
      aria-label="Status panel"
    >
      {/* Resize Handle */}
      <div
        className="h-1 bg-transparent hover:bg-blue-500 cursor-row-resize flex-shrink-0 border-t hover:border-none"
        onMouseDown={resizeMouseDownHandler}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize status panel"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const step = 20;
            const newHeight =
              e.key === "ArrowUp"
                ? Math.min(panelHeight + step, window.innerHeight - 400)
                : Math.max(panelHeight - step, 100);
            setPanelHeight(newHeight);
          }
        }}
      />

      {/* Tab Navigation */}
      <div className="flex border-b border-border bg-muted/30 justify-between items-center">
        <div className="flex" role="tablist" aria-label="Status panel tabs">
          <button
            onClick={() => handleTabClick("Output")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeList === "Output"
                ? "border-foreground text-foreground bg-background"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            role="tab"
            aria-selected={activeList === "Output"}
            aria-controls="output-panel"
            id="output-tab"
          >
            Output
          </button>
          <button
            onClick={() => handleTabClick("Error")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              activeList === "Error"
                ? "border-foreground text-foreground bg-background"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            role="tab"
            aria-selected={activeList === "Error"}
            aria-controls="error-panel"
            id="error-tab"
          >
            Error
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-semibold min-w-[20px] text-center",
                errorList.length === 0
                  ? "bg-gray-500 text-white"
                  : "bg-red-500 text-white"
              )}
              aria-label={`${errorList.length} error${
                errorList.length === 1 ? "" : "s"
              }`}
            >
              {errorList.length}
            </span>
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={toggleStatusPanel}
          className="p-1 mr-2 rounded hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close status panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {activeList === "Output" && (
          <div className="space-y-1">
            {outputList.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                No output messages
              </div>
            ) : (
              outputList.map((message, index) => (
                <div key={index} className="text-sm font-mono">
                  {message}
                </div>
              ))
            )}
          </div>
        )}

        {activeList === "Error" && (
          <div className="space-y-1">
            {errorList.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                No error messages
              </div>
            ) : (
              errorList.map((error, index) => (
                <div key={index} className="text-sm font-mono">
                  <span
                    className={cn(
                      "font-semibold",
                      getErrorMessageColor(error.type)
                    )}
                  >
                    [{error.type.toUpperCase()}]
                  </span>{" "}
                  <span className="text-foreground">{error.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
