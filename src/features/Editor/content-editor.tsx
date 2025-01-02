import { Editor as MonacoEditor } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";
import { useAppSelector } from "@/hooks/hooks";
import { selectOpenFile } from "@/API/editor-api/editor-api.slice";
import Breadcrumbs from "./breadcrumbs";
import ContentEditorMenubar from "./content-editor-menubar";
import { useState } from "react";
import { EditorForm } from "./editor-from/editor-form";
import yaml_schema from "@/test_data/CDM-ENTITY";

loader.config({ monaco });

export function ContentEditor() {
  const openFile = useAppSelector(selectOpenFile);
  const [modes, setModes] = useState<string>("YAML");

  return (
    <div className="bg-background flex-1 flex flex-col overflow-hidden">
      {openFile?.id ? (
        <>
          <ContentEditorMenubar id={openFile.id} setMode={setModes} />
          <Breadcrumbs id={openFile.id} />
          {modes === "YAML" ? (
            <div className="flex-1 overflow-hidden ">
              <MonacoEditor
                theme="vs-dark"
                path={openFile.id}
                defaultLanguage={"yaml"}
                defaultValue={openFile.content}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-auto ">
              <EditorForm yamlSchema={yaml_schema} />
            </div>
          )}
        </>
      ) : (
        "no file opened"
      )}
    </div>
  );
}
