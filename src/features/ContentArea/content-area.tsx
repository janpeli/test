import { useAppSelector } from "@/hooks/hooks";
import { selectEditedFiles } from "@/API/editor-api/editor-api.slice";
import Editor from "../Editor/editor";

export default function ContentArea() {
  const editorData = useAppSelector(selectEditedFiles);
  return (
    <div className="flex-1 bg-muted flex flex-col">
      {editorData.length ? <Editor /> : null}
    </div>
  );
}
