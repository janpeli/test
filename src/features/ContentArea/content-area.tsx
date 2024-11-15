import { useAppSelector } from "@/hooks/hooks";
import { selectEditedFiles } from "@/API/editor-api/editor-api.slice";
import Editor from "../Editor/editor";
//import DynamicForm from "../Editor/dynamic-form";
import { EditorForm } from "../Editor/editor-from/editor-form";
//import { Table } from "../Editor/editor-from/table/table";
import yaml_schema from "@/test_data/CDM-ENTITY.TSX";

export default function ContentArea() {
  const editorData = useAppSelector(selectEditedFiles);

  return (
    <div className="flex-1 bg-muted flex flex-col overflow-hidden">
      {editorData.length ? (
        <Editor />
      ) : (
        <div className="flex flex-col flex-1 text-muted-foreground overflow-scroll">
          {/* Push Ctrl + Shift + N to start new project*/}
          {
            <EditorForm yamlSchema={yaml_schema} />
            /* justify-center items-center text-muted-foreground*/
          }
        </div>
      )}
    </div>
  );
}
