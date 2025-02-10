import { useAppSelector } from "@/hooks/hooks";
import ContentEditor from "./content-editor";
import TabArea from "./tab-area/tab-area";
import { selectEditors } from "@/API/editor-api/editor-api.selectors";
import { setActiveEditor } from "@/API/editor-api/editor-api";

function Editor() {
  const editors = useAppSelector(selectEditors);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {editors.map((editor) => (
        <div
          key={editor.editorIdx}
          className="flex flex-col flex-1 overflow-hidden"
          onClick={() => setActiveEditor(editor.editorIdx)}
        >
          <TabArea editorIdx={editor.editorIdx} />
          <ContentEditor editorIdx={editor.editorIdx} />
        </div>
      ))}
    </div>
  );
}

export default Editor;
