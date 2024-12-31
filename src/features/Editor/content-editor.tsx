import { Editor as MonacoEditor } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";
import { useAppSelector } from "@/hooks/hooks";
import { selectOpenFile } from "@/API/editor-api/editor-api.slice";
import Breadcrumbs from "./breadcrumbs";
import ContentEditorMenubar from "./content-editor-menubar";

loader.config({ monaco });

export function ContentEditor() {
  const openFile = useAppSelector(selectOpenFile);

  return (
    <div className=" grow bg-background">
      {openFile?.id ? (
        <>
          <ContentEditorMenubar id={openFile.id} />
          <Breadcrumbs id={openFile.id} />
          <MonacoEditor
            height="100%"
            theme="vs-dark"
            path={openFile.id}
            defaultLanguage={"yaml"}
            defaultValue={openFile.content}
          />
        </>
      ) : (
        "no file opened"
      )}
    </div>
  );
}
