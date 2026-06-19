import Breadcrumbs from "./breadcrumbs";
import ContentEditorMenubar from "./content-editor-menubar";
import React from "react";
import MonacoEditor from "./monaco-editor/monaco-editor";
import EditorFormPanels from "./editor-from/editor-form-panels";
import MarkdownEditor from "./markdown-editor/markdown-editor";
import CanvasEditor from "./canvas-editor/canvas-editor";
import ProductEditor from "./product-editor/product-editor";
import GitHistoryEditor from "./git-history/git-history-editor";
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
  const showCanvas = activeViews.includes("CANVAS");
  const showProduct = activeViews.includes("PRODUCT");
  const showHistory = activeViews.includes("HISTORY");

  // Use DOM order to determine which pane gets the fixed width — activeViews order
  // can differ from DOM order (e.g. after toggling views off then on), which would
  // make the handle move opposite to the mouse.
  const domOrder = [
    "SOURCE",
    "FORM",
    "MARKDOWN",
    "CANVAS",
    "PRODUCT",
    "HISTORY",
  ] as const;
  const leftmostActiveView = domOrder.find((v) => activeViews.includes(v));

  const getPaneStyle = (
    view: "SOURCE" | "FORM" | "MARKDOWN" | "CANVAS" | "PRODUCT" | "HISTORY"
  ) => {
    if (!activeViews.includes(view)) return { width: 0, overflow: "hidden" as const };
    if (!isSplit) return { flex: 1 };
    return view === leftmostActiveView ? { width: `${splitRatio}%` } : { flex: 1 };
  };

  return (
    <div className="bg-background flex-1 flex flex-col overflow-hidden">
      <ContentEditorMenubar editorIdx={editorIdx} />
      <Breadcrumbs editorIdx={editorIdx} />

      <div ref={containerRef} className="flex-1 flex flex-row overflow-hidden">
        {/* SOURCE pane — Monaco always in DOM to preserve editor state */}
        <div
          className="flex flex-col overflow-hidden"
          style={getPaneStyle("SOURCE")}
          aria-hidden={!showSource}
        >
          <MonacoEditor editorIdx={editorIdx} />
        </div>

        {isSplit && <VerticalResizeHandle onMouseDown={handleMouseDown} />}

        {/* FORM pane — always in DOM to preserve scroll state */}
        <div
          className="flex flex-col overflow-hidden"
          style={getPaneStyle("FORM")}
          aria-hidden={!showForm}
        >
          <EditorFormPanels editorIdx={editorIdx} />
        </div>

        {/* MARKDOWN pane */}
        <div
          className="flex flex-col overflow-hidden"
          style={getPaneStyle("MARKDOWN")}
          aria-hidden={!showMarkdown}
        >
          <MarkdownEditor editorIdx={editorIdx} />
        </div>

        {/* CANVAS pane */}
        <div
          className="flex flex-col overflow-hidden"
          style={getPaneStyle("CANVAS")}
          aria-hidden={!showCanvas}
        >
          <CanvasEditor editorIdx={editorIdx} />
        </div>

        {/* PRODUCT pane */}
        <div
          className="flex flex-col overflow-hidden"
          style={getPaneStyle("PRODUCT")}
          aria-hidden={!showProduct}
        >
          <ProductEditor editorIdx={editorIdx} />
        </div>

        {/* HISTORY pane */}
        <div
          className="flex flex-col overflow-hidden"
          style={getPaneStyle("HISTORY")}
          aria-hidden={!showHistory}
        >
          <GitHistoryEditor editorIdx={editorIdx} />
        </div>
      </div>
    </div>
  );
});

ContentEditor.displayName = "ContentEditor";
export default ContentEditor;
