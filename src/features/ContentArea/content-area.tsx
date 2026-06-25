import { useAppSelector } from "@/hooks/hooks";
import { selectEditorsLength } from "@/API/editor-api/editor-api.selectors";
import Editor from "../Editor/editor";
import StatusPanel from "../StatusPanel/status-panel";
import { selectProjectName } from "@/API/project-api/project-api.selectors";

export default function ContentArea() {
  const numberOfEditors = useAppSelector(selectEditorsLength);
  const projectName = useAppSelector(selectProjectName);

  return (
    <main className="flex-1 bg-muted flex flex-col overflow-hidden">
      {numberOfEditors ? (
        <Editor />
      ) : (
        <div className="text-muted-foreground flex-1 flex flex-col justify-center items-center">
          {projectName ? (
            <span>
              Push{" "}
              <kbd className=" border p-1 shadow-sm border-border">Ctrl</kbd> +{" "}
              <kbd className=" border p-1 shadow-sm">k</kbd> to open Command
              Palette
            </span>
          ) : (
            <span>
              Push{" "}
              <kbd className=" border p-1 shadow-sm border-border">Ctrl</kbd> +{" "}
              <kbd className=" border p-1 shadow-sm">o</kbd> to open project
            </span>
          )}
        </div>
      )}
      <StatusPanel />
    </main>
  );
}
