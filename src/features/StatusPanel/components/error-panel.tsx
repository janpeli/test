// src\features\StatusPanel\components\error-panel.tsx
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/hooks/hooks";
import { selectErrorList } from "@/API/GUI-api/status-panel.slice";

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
        errorList.map((error, index) => (
          <div key={index} className="text-sm font-mono">
            <span
              className={cn("font-semibold", getErrorMessageColor(error.type))}
            >
              [{error.type.toUpperCase()}]
            </span>{" "}
            <span className="text-foreground">{error.message}</span>
          </div>
        ))
      )}
    </div>
  );
};
