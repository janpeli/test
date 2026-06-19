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
import { EditorModeType } from "@/API/editor-api/editor-api.slice";
import {
  selectOpenFile,
  selectOpenFileActiveViews,
  selectOpenFilePaneSizes,
} from "@/API/editor-api/editor-api.selectors";

type ContentEditorParams = {
  editorIdx: number;
};

// Fixed left-to-right order of the panes in the DOM. activeViews order can
// differ (e.g. after toggling views off then on), so DOM order is the single
// source of truth for which panes are adjacent and where handles sit.
const DOM_ORDER: readonly EditorModeType[] = [
  "SOURCE",
  "FORM",
  "MARKDOWN",
  "CANVAS",
  "PRODUCT",
  "HISTORY",
] as const;

const ContentEditor = React.memo(function ContentEditor({
  editorIdx,
}: ContentEditorParams) {
  const openFile = useAppSelectorWithParams(selectOpenFile, { editorIdx });
  const activeViews =
    useAppSelectorWithParams(selectOpenFileActiveViews, { editorIdx }) ?? [];
  const paneSizes =
    useAppSelectorWithParams(selectOpenFilePaneSizes, { editorIdx }) ?? {};

  const visibleViews = DOM_ORDER.filter((v) => activeViews.includes(v));

  const { containerRef, handleMouseDown, resetGap } = useVerticalSplit(
    openFile?.id,
    visibleViews,
    paneSizes
  );

  // Visible panes share the row by flex-grow weight (default 1); hidden panes
  // stay mounted at zero width to preserve their editor/scroll state.
  const getPaneStyle = (view: EditorModeType): React.CSSProperties => {
    if (!activeViews.includes(view)) {
      return { width: 0, overflow: "hidden", flex: "none" };
    }
    return { flexGrow: paneSizes[view] ?? 1, flexBasis: 0, minWidth: 0 };
  };

  const paneContent: Record<EditorModeType, React.ReactNode> = {
    SOURCE: <MonacoEditor editorIdx={editorIdx} />,
    FORM: <EditorFormPanels editorIdx={editorIdx} />,
    MARKDOWN: <MarkdownEditor editorIdx={editorIdx} />,
    CANVAS: <CanvasEditor editorIdx={editorIdx} />,
    PRODUCT: <ProductEditor editorIdx={editorIdx} />,
    HISTORY: <GitHistoryEditor editorIdx={editorIdx} />,
  };

  return (
    <div className="bg-background flex-1 flex flex-col overflow-hidden">
      <ContentEditorMenubar editorIdx={editorIdx} />
      <Breadcrumbs editorIdx={editorIdx} />

      <div ref={containerRef} className="flex-1 flex flex-row overflow-hidden">
        {DOM_ORDER.map((view) => {
          const isVisible = activeViews.includes(view);
          // Insert a handle before every visible pane except the first, so one
          // handle sits between each adjacent pair of visible panes.
          const visibleIdx = visibleViews.indexOf(view);
          const prevVisible =
            visibleIdx > 0 ? visibleViews[visibleIdx - 1] : undefined;

          return (
            <React.Fragment key={view}>
              {isVisible && prevVisible && (
                <VerticalResizeHandle
                  onMouseDown={handleMouseDown(prevVisible, view)}
                  onDoubleClick={() => resetGap(prevVisible, view)}
                />
              )}
              <div
                className="flex flex-col overflow-hidden"
                style={getPaneStyle(view)}
                aria-hidden={!isVisible}
              >
                {paneContent[view]}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
});

ContentEditor.displayName = "ContentEditor";
export default ContentEditor;
