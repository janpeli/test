import { useEffect, useRef, useCallback, useState } from "react";
import * as monaco from "monaco-editor";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import {
  selectOpenFileContent,
  selectOpenFileId,
} from "@/API/editor-api/editor-api.selectors";
import { setFileContent } from "@/API/editor-api/editor-api.slice";
import { scheduleFormSyncFromContent } from "@/API/editor-api/editor-api";
import { store } from "@/app/store";
import { registerMonacoShortcuts } from "@/lib/shortcuts/monaco-keybindings";
import { MonacoViewStateManager } from "../monaco-view-state.core";

type MonacoEditorProps = {
  editorIdx: number;
};

function MonacoEditor(props: MonacoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const currentFileIdRef = useRef<string | undefined>(undefined);
  // Per-file view-state persistence (scroll/cursor/folding across hidden
  // panes and tab switches) — see monaco-view-state.core.ts.
  const viewStateRef = useRef<MonacoViewStateManager | null>(null);
  // True while applying an external content sync, so the synchronous change event
  // is skipped and not recorded as a user (source) edit.
  const isApplyingExternalRef = useRef(false);
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
      case "sql":
        return "sql";
      default:
        return "yaml"; // Default to YAML for your use case
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
        fontFamily:
          '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontLigatures: true,
      });

      // Monaco measures glyph widths at creation time; the self-hosted
      // JetBrains Mono woff2 loads async (font-display: swap), so re-measure
      // once it is ready to keep the cursor/columns aligned.
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => monaco.editor.remeasureFonts());
      }

      editorRef.current.onDidChangeModelContent(() => {
        // Note: deliberately NOT gated on the manager's restore window —
        // restoring a view state never mutates content, and dropping a
        // genuine edit here would desync the store (and lose it on save).
        if (currentFileIdRef.current && !isApplyingExternalRef.current) {
          const value = editorRef.current?.getModel()?.getValue();
          if (value !== undefined) {
            // fromSource marks SOURCE as the latest edit so a save persists this
            // content instead of the stale form data.
            store.dispatch(
              setFileContent({
                fileId: currentFileIdRef.current,
                content: value,
                fromSource: true,
              })
            );
            // Live SOURCE->FORM: re-parse into the form once typing pauses.
            scheduleFormSyncFromContent(currentFileIdRef.current);
          }
        }
      });

      // App keyboard shortcuts must work while the editor has focus too.
      registerMonacoShortcuts(editorRef.current);

      // Eager per-file view-state persistence (snapshots while visible,
      // re-restores on unhide) — see monaco-view-state.core.ts.
      const viewStateManager = new MonacoViewStateManager();
      viewStateManager.attach(editorRef.current, () => currentFileIdRef.current);
      viewStateRef.current = viewStateManager;

      // Capture ref values so the cleanup closure sees the values from
      // the time the effect ran, not when it tears down.
      const modelsSnapshot = modelsRef.current;
      return () => {
        if (editorRef.current) {
          viewStateManager.detach();
          viewStateRef.current = null;

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
  }, []);

  // Handle file switching
  useEffect(() => {
    if (!editorRef.current) return;

    // Save view state of previous file
    if (
      currentFileIdRef.current &&
      currentFileIdRef.current !== currentFileId
    ) {
      viewStateRef.current?.save(currentFileIdRef.current);
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
          viewStateRef.current?.restore(currentFileId);
        }
      });

    } else if (!currentFileId) {
      // No file selected, clear editor
      editorRef.current.setModel(null);
    }
  }, [currentFileId, getOrCreateModel]);

  // Handle content changes (when file content is updated externally)
  useEffect(() => {
    if (editorRef.current && currentFileId && activeFileContent !== undefined) {
      const currentModel = editorRef.current.getModel();
      if (currentModel && currentModel.getValue() !== activeFileContent) {
        // Content updated externally (save reconcile, canvas drag-insert). Apply
        // as a full-range edit, not setValue() — setValue() clears the native
        // undo stack, losing the user's Ctrl+Z history. pushEditOperations keeps
        // it undoable; bracket it so the change event isn't re-dispatched as a
        // user (source) edit.
        isApplyingExternalRef.current = true;
        currentModel.pushEditOperations(
          null,
          [{ range: currentModel.getFullModelRange(), text: activeFileContent }],
          () => null
        );
        isApplyingExternalRef.current = false;
      }
    }
  }, [activeFileContent, currentFileId]);

  return <div ref={containerRef} className="flex-1 overflow-hidden" />;
}

export default MonacoEditor;
