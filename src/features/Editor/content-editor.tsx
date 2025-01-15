import { useAppSelector } from "@/hooks/hooks";
import { selectOpenFile } from "@/API/editor-api/editor-api.slice";
import Breadcrumbs from "./breadcrumbs";
import ContentEditorMenubar from "./content-editor-menubar";
import { useState } from "react";
import { EditorForm } from "./editor-from/editor-form";
import yaml_schema from "@/test_data/CDM-ENTITY";
import { cn } from "@/lib/utils";
import MonacoEditor from "./monaco-editor/monaco-editor";

export function ContentEditor() {
  const openFile = useAppSelector(selectOpenFile);
  const [modes, setModes] = useState<string>("YAML");

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
            <MonacoEditor />
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
