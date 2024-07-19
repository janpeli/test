import { ContentEditor } from "./content-editor";
import { TabArea } from "./tab-area";

function Editor() {
  return (
    <div className="flex flex-col flex-1">
      <TabArea />
      <ContentEditor />
    </div>
  );
}

export default Editor;
