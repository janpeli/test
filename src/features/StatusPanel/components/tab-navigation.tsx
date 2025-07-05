// src\features\StatusPanel\components\tab-navigation.tsx
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import {
  setActivePanel,
  toggleStatusPanel,
} from "@/API/GUI-api/status-panel-api";
import {
  selectActiveList,
  selectErrorList,
} from "@/API/GUI-api/status-panel.slice";
import { useAppSelector } from "@/hooks/hooks";

export const TabNavigation = () => {
  const activeList = useAppSelector(selectActiveList);

  const onTabClick = (tab: "Output" | "Error") => {
    setActivePanel(tab);
  };

  return (
    <div className="flex border-b border-border bg-muted/30 justify-between items-center">
      <div className="flex" role="tablist" aria-label="Status panel tabs">
        <button
          onClick={() => onTabClick("Output")}
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
          onClick={() => onTabClick("Error")}
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
          <ErrorCountPill />
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
  );
};

const ErrorCountPill = () => {
  const errorList = useAppSelector(selectErrorList);
  const errorCount = errorList.length;
  return (
    <span
      className={cn(
        "text-xs px-2 py-0.5 rounded-full font-semibold min-w-[20px] text-center",
        errorCount === 0 ? "bg-gray-500 text-white" : "bg-red-500 text-white"
      )}
      aria-label={`${errorCount} error${errorCount === 1 ? "" : "s"}`}
    >
      {errorCount}
    </span>
  );
};
