import { TabArea } from "./tab-area";

function ContentEditor() {
  return <div></div>;
}

function Editor() {
  return (
    <div>
      <TabArea />
      <ContentEditor />
    </div>
  );
}

export default Editor;
