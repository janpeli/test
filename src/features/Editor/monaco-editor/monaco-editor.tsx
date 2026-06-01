import { useEffect, useRef, useCallback, useState } from "react";
import * as monaco from "monaco-editor";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import {
  selectOpenFileContent,
  selectOpenFileId,
} from "@/API/editor-api/editor-api.selectors";
import { setFileContent } from "@/API/editor-api/editor-api.slice";
import { store } from "@/app/store";

type MonacoEditorProps = {
  editorIdx: number;
};

// Type for storing Monaco-specific view states
type MonacoViewStates = {
  [fileId: string]: monaco.editor.ICodeEditorViewState | null;
};

function MonacoEditor(props: MonacoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const currentFileIdRef = useRef<string | undefined>(undefined);
  const viewStatesRef = useRef<MonacoViewStates>({});
  const isRestoringStateRef = useRef(false);
  const modelsRef = useRef<Map<string, monaco.editor.ITextModel>>(new Map());

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    monaco.editor.setTheme(isDark ? "vs-dark" : "vs");
  }, [isDark]);

  const activeFileContent = useAppSelectorWithParams(selectOpenFileContent, {
    editorIdx: props.editorIdx,
  });
  const activeFileContentRef = useRef(activeFileContent);
  activeFileContentRef.current = activeFileContent;

  const currentFileId = useAppSelectorWithParams(selectOpenFileId, {
    editorIdx: props.editorIdx,
  });

  // Helper function to get file language based on extension
  const getLanguageFromFilename = useCallback((filename: string): string => {
    const extension = filename.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "yaml":
      case "yml":
        return "yaml";
      case "json":
        return "json";
      case "js":
      case "jsx":
        return "javascript";
      case "ts":
      case "tsx":
        return "typescript";
      case "py":
        return "python";
      case "css":
        return "css";
      case "html":
        return "html";
      case "xml":
        return "xml";
      case "md":
        return "markdown";
      default:
        return "yaml"; // Default to YAML for your use case
    }
  }, []);

  // Save current view state for a file
  const saveViewState = useCallback((fileId: string) => {
    if (editorRef.current && !isRestoringStateRef.current) {
      const viewState = editorRef.current.saveViewState();
      viewStatesRef.current[fileId] = viewState;
    }
  }, []);

  // Restore view state for a file
  const restoreViewState = useCallback((fileId: string) => {
    if (editorRef.current && viewStatesRef.current[fileId]) {
      isRestoringStateRef.current = true;
      editorRef.current.restoreViewState(viewStatesRef.current[fileId]);

      // Reset flag after a short delay to allow for restoration
      setTimeout(() => {
        isRestoringStateRef.current = false;
      }, 100);
    }
  }, []);

  // Get or create model for a file
  const getOrCreateModel = useCallback(
    (fileId: string, content: string): monaco.editor.ITextModel => {
      let model = modelsRef.current.get(fileId);

      if (!model || model.isDisposed()) {
        // Dispose old model if it exists
        if (model && !model.isDisposed()) {
          model.dispose();
        }

        // Create new model
        const uri = monaco.Uri.file(fileId);
        const language = getLanguageFromFilename(fileId);
        model = monaco.editor.createModel(content, language, uri);
        modelsRef.current.set(fileId, model);
      } else {
        // Update existing model content if different
        if (model.getValue() !== content) {
          model.setValue(content);
        }
      }

      return model;
    },
    [getLanguageFromFilename]
  );

  // Initialize Monaco Editor
  useEffect(() => {
    if (!editorRef.current && containerRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: "",
        language: "yaml",
        theme: "vs-dark",
        automaticLayout: true,
        readOnly: false,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        wordWrap: "on",
      });

      editorRef.current.onDidChangeModelContent(() => {
        if (currentFileIdRef.current && !isRestoringStateRef.current) {
          const value = editorRef.current?.getModel()?.getValue();
          if (value !== undefined) {
            store.dispatch(setFileContent({ fileId: currentFileIdRef.current, content: value }));
          }
        }
      });

      // Capture ref values so the cleanup closure sees the values from
      // the time the effect ran, not when it tears down.
      const modelsSnapshot = modelsRef.current;
      return () => {
        if (editorRef.current) {
          if (currentFileIdRef.current) {
            saveViewState(currentFileIdRef.current);
          }

          modelsSnapshot.forEach((model) => {
            if (!model.isDisposed()) {
              model.dispose();
            }
          });
          modelsSnapshot.clear();

          editorRef.current.dispose();
          editorRef.current = null;
        }
      };
    }
  }, [saveViewState]);

  // Handle file switching
  useEffect(() => {
    if (!editorRef.current) return;

    // Save view state of previous file
    if (
      currentFileIdRef.current &&
      currentFileIdRef.current !== currentFileId
    ) {
      saveViewState(currentFileIdRef.current);
    }

    // Update current file reference
    currentFileIdRef.current = currentFileId;

    // Handle new file
    if (currentFileId && activeFileContentRef.current !== undefined) {
      // Get or create model for the new file
      const model = getOrCreateModel(currentFileId, activeFileContentRef.current);

      // Set the model in editor
      editorRef.current.setModel(model);

      // Restore view state after model is set
      requestAnimationFrame(() => {
        if (currentFileId) {
          restoreViewState(currentFileId);
        }
      });

    } else if (!currentFileId) {
      // No file selected, clear editor
      editorRef.current.setModel(null);
    }
  }, [currentFileId, saveViewState, getOrCreateModel, restoreViewState]);

  // Handle content changes (when file content is updated externally)
  useEffect(() => {
    if (editorRef.current && currentFileId && activeFileContent !== undefined) {
      const currentModel = editorRef.current.getModel();
      if (currentModel && currentModel.getValue() !== activeFileContent) {
        // Content was updated externally, update model
        currentModel.setValue(activeFileContent);
      }
    }
  }, [activeFileContent, currentFileId]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Save current view state on unmount
      if (currentFileIdRef.current) {
        saveViewState(currentFileIdRef.current);
      }
    };
  }, [saveViewState]);

  return <div ref={containerRef} className="flex-1 overflow-hidden" />;
}

export default MonacoEditor;
