import { useAppSelector } from "@/hooks/hooks";
import { selectEditorsLength } from "@/API/editor-api/editor-api.slice";
import Editor from "../Editor/editor";

export default function ContentArea() {
  const numberOfEditors = useAppSelector(selectEditorsLength);
  console.log("editorData.length: ", numberOfEditors);
  return (
    <main className="flex-1 bg-muted flex flex-col overflow-hidden">
      {numberOfEditors ? (
        <Editor />
      ) : (
        <div className="text-muted-foreground flex-1 flex flex-col justify-center items-center">
          <span>
            Push <kbd className=" border p-1 shadow-sm border-border">Ctrl</kbd>{" "}
            + <kbd className=" border p-1 shadow-sm">Shift</kbd> +{" "}
            <kbd className=" border p-1 shadow-sm">N</kbd> to start new project
          </span>
        </div>
      )}
    </main>
  );
}
