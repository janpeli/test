// src\features\StatusPanel\components\panel-content.tsx
import { OutputPanel } from "./output-panel";
import { ErrorPanel } from "./error-panel";
import { useAppSelector } from "@/hooks/hooks";
import { selectActiveList } from "@/API/GUI-api/status-panel.slice";

export const PanelContent = () => {
  const activeList = useAppSelector(selectActiveList);
  return (
    <div className="flex-1 overflow-auto p-4">
      {activeList === "Output" && <OutputPanel />}
      {activeList === "Error" && <ErrorPanel />}
    </div>
  );
};
