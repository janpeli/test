import { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import { Check, Copy } from "lucide-react";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import {
  selectOpenFileActiveProduct,
  selectOpenFileData,
  selectOpenFileId,
} from "@/API/editor-api/editor-api.selectors";
import { Button } from "@/components/ui/button";
import { resolveProductContext } from "@/lib/products/resolve-references";

type ProductEditorProps = {
  editorIdx: number;
};

const NO_PRODUCT_KEY = "__none__";

/**
 * Read-only pane showing the generated text of the currently selected product
 * (an object-type template applied to the open object's data). Rendering runs in
 * the main process via `window.project.renderProduct` because Nunjucks needs
 * `eval`, which the renderer CSP forbids. Text is selectable for native Ctrl+C;
 * the toolbar also offers a copy button.
 *
 * One Monaco model + view state (scroll, cursor, find-widget state) is kept per
 * fileId+product key, mirroring monaco-editor.tsx's per-file model map — so
 * switching file tabs or products in the dropdown doesn't clobber scroll
 * position or search state for the pane you're leaving.
 */
function ProductEditor({ editorIdx }: ProductEditorProps) {
  const fileId = useAppSelectorWithParams(selectOpenFileId, { editorIdx });
  const product = useAppSelectorWithParams(selectOpenFileActiveProduct, {
    editorIdx,
  });
  const data = useAppSelectorWithParams(selectOpenFileData, { editorIdx });

  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const modelsRef = useRef<Map<string, monaco.editor.ITextModel>>(new Map());
  const viewStatesRef = useRef<
    Map<string, monaco.editor.ICodeEditorViewState | null>
  >(new Map());
  const currentKeyRef = useRef<string | undefined>(undefined);
  const isRestoringStateRef = useRef(false);

  // Mirrors the currently displayed model's content, purely for the copy
  // button (enabled state + clipboard text) — not the model's source of truth.
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

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

  const template = product?.definition;
  const language = product?.language ?? "sql";
  const key = fileId
    ? `${fileId}::${product?.name ?? NO_PRODUCT_KEY}`
    : undefined;

  // Re-render only when the template or the underlying data actually changes;
  // `dataKey` is a stable string even though the parsed-data object identity may
  // change each render. `data` itself is read through a ref to stay fresh.
  const dataKey = JSON.stringify(data);
  const dataRef = useRef(data);
  dataRef.current = data;

  const getOrCreateModel = (
    modelKey: string
  ): monaco.editor.ITextModel => {
    let model = modelsRef.current.get(modelKey);
    if (!model || model.isDisposed()) {
      const uri = monaco.Uri.from({
        scheme: "product",
        path: `/${encodeURIComponent(modelKey)}`,
      });
      model = monaco.editor.createModel("", "sql", uri);
      modelsRef.current.set(modelKey, model);
    }
    return model;
  };

  const saveViewState = (modelKey: string) => {
    if (editorRef.current && !isRestoringStateRef.current) {
      viewStatesRef.current.set(modelKey, editorRef.current.saveViewState());
    }
  };

  const restoreViewState = (modelKey: string) => {
    const viewState = viewStatesRef.current.get(modelKey);
    if (editorRef.current && viewState) {
      isRestoringStateRef.current = true;
      editorRef.current.restoreViewState(viewState);
      setTimeout(() => {
        isRestoringStateRef.current = false;
      }, 100);
    }
  };

  // Create the read-only editor once.
  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;
    editorRef.current = monaco.editor.create(containerRef.current, {
      value: "",
      language: "sql",
      theme: document.documentElement.classList.contains("dark")
        ? "vs-dark"
        : "vs",
      automaticLayout: true,
      readOnly: true,
      domReadOnly: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: "on",
    });
    const modelsSnapshot = modelsRef.current;
    return () => {
      if (currentKeyRef.current) saveViewState(currentKeyRef.current);
      modelsSnapshot.forEach((model) => {
        if (!model.isDisposed()) model.dispose();
      });
      modelsSnapshot.clear();
      editorRef.current?.dispose();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch models when the active file/product changes, saving and restoring
  // per-key view state (scroll position, cursor, find-widget search state).
  useEffect(() => {
    if (!editorRef.current) return;
    if (currentKeyRef.current && currentKeyRef.current !== key) {
      saveViewState(currentKeyRef.current);
    }
    currentKeyRef.current = key;
    if (key) {
      const model = getOrCreateModel(key);
      editorRef.current.setModel(model);
      monaco.editor.setModelLanguage(model, language);
      setOutput(model.getValue());
      requestAnimationFrame(() => restoreViewState(key));
    } else {
      editorRef.current.setModel(null);
      setOutput("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Resolve refs and render the template, writing the result into the model
  // for the key that was active when this render started (not necessarily the
  // one on screen by the time it resolves, if the user has since switched).
  useEffect(() => {
    if (!key) return;
    const renderKey = key;
    if (template === undefined) {
      const model = getOrCreateModel(renderKey);
      if (model.getValue() !== "") model.setValue("");
      if (currentKeyRef.current === renderKey) setOutput("");
      return;
    }
    let cancelled = false;
    // Debounce so live form edits don't fire an IPC round-trip per keystroke.
    const handle = setTimeout(async () => {
      // Resolve $reference / $sub_reference fields (async file reads) into plain
      // data before handing the context to the template renderer.
      const context = await resolveProductContext(dataRef.current);
      if (cancelled) return;
      const result = await window.project.renderProduct({
        template,
        context,
      });
      if (cancelled) return;
      const text = result.error
        ? `-- Product render error:\n-- ${result.error}`
        : result.text ?? "";
      const model = getOrCreateModel(renderKey);
      if (model.getValue() !== text) model.setValue(text);
      monaco.editor.setModelLanguage(model, language);
      if (currentKeyRef.current === renderKey) setOutput(text);
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, template, dataKey, language]);

  useEffect(() => {
    monaco.editor.setTheme(isDark ? "vs-dark" : "vs");
  }, [isDark]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex h-8 items-center justify-between border-b px-2 gap-2">
        <span className="text-xs text-muted-foreground truncate">
          {product ? product.name : "No product"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={handleCopy}
          disabled={!output}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden" />
    </div>
  );
}

export default ProductEditor;
