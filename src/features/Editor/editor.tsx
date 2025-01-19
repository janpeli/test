import { useAppSelector } from "@/hooks/hooks";
import { ContentEditor } from "./content-editor";
import { TabArea } from "./tab-area";
import { selectEditors } from "@/API/editor-api/editor-api.slice";

function Editor() {
  const editors = useAppSelector(selectEditors);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {editors.map((editor) => {
        return (
          <div
            key={editor.editorIdx}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <TabArea editorIdx={editor.editorIdx} />
            <ContentEditor editorIdx={editor.editorIdx} />
          </div>
        );
      })}
    </div>
  );
}

export default Editor;
