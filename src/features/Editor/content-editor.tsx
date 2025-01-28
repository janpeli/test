import Breadcrumbs from "./breadcrumbs";
import ContentEditorMenubar from "./content-editor-menubar";
import { useState } from "react";
import { cn } from "@/lib/utils";
import MonacoEditor from "./monaco-editor/monaco-editor";
import EditorFormPanels from "./editor-form-panels";
import React from "react";

type ContentEditorParams = {
  editorIdx: number;
};

const ContentEditor = React.memo(function ContentEditor({
  editorIdx,
}: ContentEditorParams) {
  //const openFile = useAppSelectorWithParams(selectOpenFile, { editorIdx });
  const [modes, setModes] = useState<string>("YAML");

  console.log("Rendering ContentEditor");

  return (
    <div className="bg-background flex-1 flex flex-col overflow-hidden">
      <ContentEditorMenubar setMode={setModes} editorIdx={editorIdx} />
      <Breadcrumbs editorIdx={editorIdx} />
      <div
        className={cn(
          modes !== "YAML" && "hidden",
          modes === "YAML" && "flex-1 overflow-hidden flex flex-col"
        )}
        aria-hidden={modes === "YAML"}
      >
        <MonacoEditor editorIdx={editorIdx} />
      </div>
      <div
        className={cn(
          modes === "YAML" && "hidden",
          modes !== "YAML" && "flex-1 overflow-auto "
        )}
        aria-hidden={modes !== "YAML"}
      >
        <EditorFormPanels editorIdx={editorIdx} />
      </div>
    </div>
  );
});

ContentEditor.displayName = "ContentEditor";
export default ContentEditor;
