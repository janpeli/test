// src\features\StatusPanel\components\output-panel.tsx
import { selectOutputList } from "@/API/GUI-api/status-panel.slice";
import { useAppSelector } from "@/hooks/hooks";

export const OutputPanel = () => {
  const outputList = useAppSelector(selectOutputList);
  return (
    <div className="space-y-1">
      {outputList.length === 0 ? (
        <div className="text-muted-foreground text-sm">No output messages</div>
      ) : (
        outputList.map((message, index) => (
          <div key={index} className="text-sm font-mono">
            {message}
          </div>
        ))
      )}
    </div>
  );
};
