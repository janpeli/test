import Breadcrumbs from "./breadcrumbs";
import ContentEditorMenubar from "./content-editor-menubar";
import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import MonacoEditor from "./monaco-editor/monaco-editor";
import EditorFormPanels from "./editor-from/editor-form-panels";
import React from "react";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import {
  selectOpenFile,
  selectOpenFileEditorMode,
} from "@/API/editor-api/editor-api.selectors";
import { setFileMode } from "@/API/editor-api/editor-api";
import { EditorMode } from "@/API/editor-api/editor-api.slice";

type ContentEditorParams = {
  editorIdx: number;
};

const ContentEditor = React.memo(function ContentEditor({
  editorIdx,
}: ContentEditorParams) {
  const previousModeRef = useRef<EditorMode | null>(null);

  // Get the current file and its mode from Redux store
  const openFile = useAppSelectorWithParams(selectOpenFile, { editorIdx });
  const currentMode =
    useAppSelectorWithParams(selectOpenFileEditorMode, { editorIdx }) || "YAML";

  // Handler to change mode - this will update the file's mode in the store
  const handleModeChange = useCallback(
    (newMode: EditorMode) => {
      if (openFile?.id) {
        setFileMode(openFile.id, newMode);
      }
    },
    [openFile?.id]
  );

  // Track mode changes to preserve scroll position when switching between YAML and Form modes
  React.useEffect(() => {
    if (
      previousModeRef.current &&
      previousModeRef.current !== currentMode &&
      openFile?.id
    ) {
      // Mode changed - scroll position will be handled by individual components
      // but we can add any additional logic here if needed
    }
    previousModeRef.current = currentMode;
  }, [currentMode, openFile?.id]);

  console.log("Rendering ContentEditor");

  return (
    <div className="bg-background flex-1 flex flex-col overflow-hidden">
      <ContentEditorMenubar
        currentMode={currentMode}
        setMode={handleModeChange}
        editorIdx={editorIdx}
      />
      <Breadcrumbs editorIdx={editorIdx} />

      {/* YAML Mode - Monaco Editor */}
      <div
        className={cn(
          currentMode !== "YAML" && "hidden",
          currentMode === "YAML" && "flex-1 overflow-hidden flex flex-col"
        )}
        aria-hidden={currentMode !== "YAML"}
      >
        <MonacoEditor editorIdx={editorIdx} />
      </div>

      {/* Form Mode - Editor Form Panels */}
      <div
        className={cn(
          currentMode === "YAML" && "hidden",
          currentMode !== "YAML" && "flex-1 overflow-hidden flex flex-col"
        )}
        aria-hidden={currentMode === "YAML"}
      >
        <EditorFormPanels editorIdx={editorIdx} />
      </div>
    </div>
  );
});

ContentEditor.displayName = "ContentEditor";
export default ContentEditor;
