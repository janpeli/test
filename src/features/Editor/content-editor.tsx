import Breadcrumbs from "./breadcrumbs";
import ContentEditorMenubar from "./content-editor-menubar";
import React from "react";
import MonacoEditor from "./monaco-editor/monaco-editor";
import EditorFormPanels from "./editor-from/editor-form-panels";
import MarkdownEditor from "./markdown-editor/markdown-editor";
import { VerticalResizeHandle } from "@/components/ui/vertical-resize-handle";
import { useVerticalSplit } from "./hooks/useVerticalSplit";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import {
  selectOpenFile,
  selectOpenFileActiveViews,
  selectOpenFileSplitRatio,
} from "@/API/editor-api/editor-api.selectors";

type ContentEditorParams = {
  editorIdx: number;
};

const ContentEditor = React.memo(function ContentEditor({
  editorIdx,
}: ContentEditorParams) {
  const openFile = useAppSelectorWithParams(selectOpenFile, { editorIdx });
  const activeViews =
    useAppSelectorWithParams(selectOpenFileActiveViews, { editorIdx }) ?? [];
  const splitRatio =
    useAppSelectorWithParams(selectOpenFileSplitRatio, { editorIdx }) ?? 50;

  const isSplit = activeViews.length >= 2;
  const { containerRef, handleMouseDown } = useVerticalSplit(
    openFile?.id,
    splitRatio
  );

  const showSource = activeViews.includes("SOURCE");
  const showForm = activeViews.includes("FORM");
  const showMarkdown = activeViews.includes("MARKDOWN");

  return (
    <div className="bg-background flex-1 flex flex-col overflow-hidden">
      <ContentEditorMenubar editorIdx={editorIdx} />
      <Breadcrumbs editorIdx={editorIdx} />

      <div ref={containerRef} className="flex-1 flex flex-row overflow-hidden">
        {/* SOURCE pane — Monaco always in DOM to preserve editor state */}
        <div
          className="flex flex-col overflow-hidden"
          style={
            isSplit
              ? { width: `${splitRatio}%` }
              : showSource
                ? { flex: 1 }
                : { width: 0, overflow: "hidden" }
          }
          aria-hidden={!showSource}
        >
          <MonacoEditor editorIdx={editorIdx} />
        </div>

        {isSplit && <VerticalResizeHandle onMouseDown={handleMouseDown} />}

        {/* FORM pane — always in DOM to preserve scroll state */}
        <div
          className="flex flex-col overflow-hidden"
          style={
            isSplit
              ? { flex: 1 }
              : showForm
                ? { flex: 1 }
                : { width: 0, overflow: "hidden" }
          }
          aria-hidden={!showForm}
        >
          <EditorFormPanels editorIdx={editorIdx} />
        </div>

        {/* MARKDOWN pane */}
        <div
          className={
            showMarkdown
              ? "flex-1 flex flex-col overflow-hidden"
              : "hidden"
          }
          aria-hidden={!showMarkdown}
        >
          <MarkdownEditor editorIdx={editorIdx} />
        </div>
      </div>
    </div>
  );
});

ContentEditor.displayName = "ContentEditor";
export default ContentEditor;
