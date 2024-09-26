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
        <div className="flex flex-col flex-1 justify-center items-center text-muted-foreground">
          Push Ctrl + Shift + N to start new project
        </div>
      )}
    </div>
  );
}
