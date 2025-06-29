import { useEffect, useRef, useCallback } from "react";
import * as monaco from "monaco-editor";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import {
  selectOpenFileContent,
  selectOpenFileId,
  selectFileScrollPosition,
} from "@/API/editor-api/editor-api.selectors";
//import { updateFileScrollPos } from "@/API/editor-api/editor-api";

type MonacoEditorProps = {
  editorIdx: number;
};

function MonacoEditor(props: MonacoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const isRestoringScrollRef = useRef(false);
  const currentFileIdRef = useRef<string | undefined>(undefined);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeFileContent = useAppSelectorWithParams(selectOpenFileContent, {
    editorIdx: props.editorIdx,
  });

  const currentFileId = useAppSelectorWithParams(selectOpenFileId, {
    editorIdx: props.editorIdx,
  });

  const scrollPosition = useAppSelectorWithParams(selectFileScrollPosition, {
    editorIdx: props.editorIdx,
  });

  // Debounced save scroll position
  const saveScrollPosition = useCallback((fileId?: string) => {
    console.log("save scroll from monaco");
    const targetFileId = fileId || currentFileIdRef.current;
    if (editorRef.current && targetFileId && !isRestoringScrollRef.current) {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        if (editorRef.current && targetFileId) {
          /*  const scrollTop = editorRef.current.getScrollTop();
          const scrollLeft = editorRef.current.getScrollLeft();
          updateFileScrollPos(targetFileId, { scrollTop, scrollLeft }); */
        }
      }, 100); // 100ms debounce
    }
  }, []);

  // Restore scroll position
  const restoreScrollPosition = useCallback(() => {
    if (editorRef.current && scrollPosition && currentFileId) {
      isRestoringScrollRef.current = true;
      // Use requestAnimationFrame to ensure Monaco is ready
      requestAnimationFrame(() => {
        if (editorRef.current) {
          editorRef.current.setScrollTop(scrollPosition.scrollTop);
          editorRef.current.setScrollLeft(scrollPosition.scrollLeft);
          // Reset flag after animation frame
          setTimeout(() => {
            isRestoringScrollRef.current = false;
          }, 50);
        }
      });
    }
  }, [scrollPosition, currentFileId]);

  // Initialize Monaco Editor
  useEffect(() => {
    if (!editorRef.current && containerRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: "",
        language: "yaml",
        theme: "vs-dark",
        automaticLayout: true,
        readOnly: true,
      });

      // Add scroll event listener to save position
      const scrollListener = editorRef.current.onDidScrollChange(() => {
        if (!isRestoringScrollRef.current && currentFileIdRef.current) {
          saveScrollPosition();
        }
      });

      // Cleanup function
      return () => {
        scrollListener.dispose();
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        if (editorRef.current) {
          // Save final scroll position
          if (currentFileIdRef.current) {
            /*  const scrollTop = editorRef.current.getScrollTop();
            const scrollLeft = editorRef.current.getScrollLeft();
            updateFileScrollPos(currentFileIdRef.current, {
              scrollTop,
              scrollLeft,
            });*/
          }
          editorRef.current.dispose();
          editorRef.current = null;
        }
      };
    }
  }, [saveScrollPosition]);

  // Handle file content changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setValue(activeFileContent || " ");
    }
  }, [activeFileContent]);

  // Handle file switching
  useEffect(() => {
    // Save scroll position of previous file immediately (no debounce)
    if (
      currentFileIdRef.current &&
      currentFileIdRef.current !== currentFileId &&
      editorRef.current &&
      !isRestoringScrollRef.current
    ) {
      /*const scrollTop = editorRef.current.getScrollTop();
      const scrollLeft = editorRef.current.getScrollLeft();
      updateFileScrollPos(currentFileIdRef.current, {
        scrollTop,
        scrollLeft,
      });*/
      console.log("handling switching from monaco");
    }

    // Update current file reference
    currentFileIdRef.current = currentFileId;

    // Restore scroll position for new file
    if (currentFileId && scrollPosition) {
      // Small delay to ensure content is loaded
      setTimeout(restoreScrollPosition, 100);
    }
  }, [currentFileId, restoreScrollPosition, scrollPosition]);

  return <div ref={containerRef} className="flex-1 overflow-hidden" />;
}

export default MonacoEditor;
