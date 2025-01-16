import { useAppSelector } from "@/hooks/hooks";
import { selectEditors } from "@/API/editor-api/editor-api.slice";
import Editor from "../Editor/editor";

export default function ContentArea() {
  const editorData = useAppSelector(selectEditors);
  console.log("editorData.length: ", editorData.length, editorData);
  return (
    <main className="flex-1 bg-muted flex flex-col overflow-hidden">
      {editorData.length ? (
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
