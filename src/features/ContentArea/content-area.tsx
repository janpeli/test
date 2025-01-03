import { useAppSelector } from "@/hooks/hooks";
import { selectEditedFiles } from "@/API/editor-api/editor-api.slice";
import Editor from "../Editor/editor";

export default function ContentArea() {
  const editorData = useAppSelector(selectEditedFiles);

  return (
    <div className="flex-1 bg-muted flex flex-col overflow-hidden">
      {editorData.length ? (
        <Editor />
      ) : (
        <div className="text-muted-foreground flex-1 flex flex-col justify-center items-center">
          <span>
            Push <kbd className=" border p-1 shadow-sm">Ctrl</kbd> +{" "}
            <kbd className=" border p-1 shadow-sm">Shift</kbd> +{" "}
            <kbd className=" border p-1 shadow-sm">N</kbd> to start new project
          </span>
        </div>
      )}
    </div>
  );
}
