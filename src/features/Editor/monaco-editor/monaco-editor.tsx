import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import yaml_schema from "@/test_data/CDM-ENTITY";

function MonacoEditor() {
  const containerRef = useRef(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | undefined>(
    undefined
  );

  useEffect(() => {
    if (!containerRef.current) return;

    editorRef.current = monaco.editor.create(containerRef.current, {
      value: yaml_schema,
      language: "yaml",
      theme: "vs-dark",
      automaticLayout: true,
    });

    return () => {
      editorRef.current && editorRef.current.dispose();
    };
  }, []);

  return <div ref={containerRef} className="flex-1 overflow-hidden" />;
}

export default MonacoEditor;
