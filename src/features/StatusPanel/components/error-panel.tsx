// src\features\StatusPanel\components\error-panel.tsx
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/hooks/hooks";
import { selectErrorList } from "@/API/GUI-api/status-panel.slice";
import { clearErrors } from "@/API/GUI-api/status-panel-api";

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

export const ErrorPanel = () => {
  const errorList = useAppSelector(selectErrorList);
  return (
    <div className="space-y-1">
      {errorList.length === 0 ? (
        <div className="text-muted-foreground text-sm">No error messages</div>
      ) : (
        <>
        <div className="flex justify-end">
          <button
            onClick={clearErrors}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors"
            aria-label="Clear all error messages"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
        {errorList.map((error, index) => (
          <div key={index} className="text-sm font-mono">
            <span
              className={cn("font-semibold", getErrorMessageColor(error.type))}
            >
              [{error.type.toUpperCase()}]
            </span>{" "}
            <span className="text-foreground">{error.message}</span>
          </div>
        ))}
        </>
      )}
    </div>
  );
};
