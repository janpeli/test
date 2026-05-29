import { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import { Check, Copy } from "lucide-react";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import {
  selectOpenFileActiveProduct,
  selectOpenFileData,
} from "@/API/editor-api/editor-api.selectors";
import { Button } from "@/components/ui/button";
import { resolveProductContext } from "@/lib/products/resolve-references";

type ProductEditorProps = {
  editorIdx: number;
};

/**
 * Read-only pane showing the generated text of the currently selected product
 * (an object-type template applied to the open object's data). Rendering runs in
 * the main process via `window.project.renderProduct` because Nunjucks needs
 * `eval`, which the renderer CSP forbids. Text is selectable for native Ctrl+C;
 * the toolbar also offers a copy button.
 */
function ProductEditor({ editorIdx }: ProductEditorProps) {
  const product = useAppSelectorWithParams(selectOpenFileActiveProduct, {
    editorIdx,
  });
  const data = useAppSelectorWithParams(selectOpenFileData, { editorIdx });

  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
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

  // Re-render only when the template or the underlying data actually changes;
  // `dataKey` is a stable string even though the parsed-data object identity may
  // change each render. `data` itself is read through a ref to stay fresh.
  const dataKey = JSON.stringify(data);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (template === undefined) {
      setOutput("");
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
      setOutput(
        result.error
          ? `-- Product render error:\n-- ${result.error}`
          : result.text ?? ""
      );
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [template, dataKey]);

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
    return () => {
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, []);

  // Keep value and language in sync with the rendered product.
  useEffect(() => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model) return;
    if (model.getValue() !== output) model.setValue(output);
    monaco.editor.setModelLanguage(model, language);
  }, [output, language]);

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
