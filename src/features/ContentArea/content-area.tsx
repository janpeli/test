import { useAppSelector } from "@/hooks/hooks";
import { selectEditorsLength } from "@/API/editor-api/editor-api.selectors";
import Editor from "../Editor/editor";
import StatusPanel from "../StatusPanel/status-panel";

export default function ContentArea() {
  const numberOfEditors = useAppSelector(selectEditorsLength);
  return (
    <main className="flex-1 bg-muted flex flex-col overflow-hidden">
      {numberOfEditors ? (
        <Editor />
      ) : (
        <div className="text-muted-foreground flex-1 flex flex-col justify-center items-center">
          <span>
            Push <kbd className=" border p-1 shadow-sm border-border">Ctrl</kbd>{" "}
            + <kbd className=" border p-1 shadow-sm">O</kbd> to open a project
          </span>
        </div>
      )}
      <StatusPanel />
    </main>
  );
}
