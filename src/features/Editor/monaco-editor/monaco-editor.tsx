import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
//import yaml_schema from "@/test_data/CDM-ENTITY";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import { selectOpenFileContent } from "@/API/editor-api/editor-api.slice";

type MonacoEditorProps = {
  editorIdx: number;
};

function MonacoEditor(props: MonacoEditorProps) {
  const containerRef = useRef(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | undefined>(
    undefined
  );

  const renderCount = useRef(0);
  const activeFileContent = useAppSelectorWithParams(selectOpenFileContent, {
    editorIdx: props.editorIdx,
  });

  useEffect(() => {
    renderCount.current++;
    console.log("render count:", renderCount);
    if (!containerRef.current) return;
    if (!editorRef.current) {
      console.log("creating editor", activeFileContent);
    }

    editorRef.current = monaco.editor.create(containerRef.current, {
      value: activeFileContent,
      language: "yaml",
      theme: "vs-dark",
      automaticLayout: true,
      readOnly: true,
    });
    return () => {
      editorRef.current && editorRef.current.dispose();
      console.log("disposing");
    };
  }, []);

  useEffect(() => {
    if (editorRef.current)
      editorRef.current.setValue(activeFileContent ? activeFileContent : " ");
  }, [activeFileContent]);

  return <div ref={containerRef} className="flex-1 overflow-hidden" />;
}

export default MonacoEditor;
