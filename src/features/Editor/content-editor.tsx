import * as monaco from "monaco-editor";
import { useAppSelector } from "@/hooks/hooks";
import { selectOpenFile } from "@/API/editor-api/editor-api.slice";
import Breadcrumbs from "./breadcrumbs";
import ContentEditorMenubar from "./content-editor-menubar";
import { useEffect, useRef, useState } from "react";
import { EditorForm } from "./editor-from/editor-form";
import yaml_schema from "@/test_data/CDM-ENTITY";
import { cn } from "@/lib/utils";

export function ContentEditor() {
  const openFile = useAppSelector(selectOpenFile);
  const [modes, setModes] = useState<string>("YAML");
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const monacoEditor = monaco.editor.create(containerRef.current, {
      value: yaml_schema,
      language: "yaml",
      theme: "vs-dark",
      automaticLayout: true,
    });

    return () => {
      monacoEditor.dispose();
    };
  }, []);

  return (
    <div className="bg-background flex-1 flex flex-col overflow-hidden">
      {openFile?.id ? (
        <>
          <ContentEditorMenubar setMode={setModes} />
          <Breadcrumbs />
          <div
            className={cn(
              modes !== "YAML" && "hidden",
              modes === "YAML" && "flex-1 overflow-hidden flex flex-col"
            )}
            aria-hidden={modes === "YAML"}
          >
            <div ref={containerRef} className="flex-1 overflow-hidden" />
          </div>
          <div
            className={cn(
              modes === "YAML" && "hidden",
              modes !== "YAML" && "flex-1 overflow-auto "
            )}
            aria-hidden={modes !== "YAML"}
          >
            <EditorForm yamlSchema={yaml_schema} />
          </div>
        </>
      ) : (
        "no file opened"
      )}
    </div>
  );
}
