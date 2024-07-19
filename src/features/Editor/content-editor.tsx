import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";
import { useAppSelector } from "@/hooks/hooks";
import { selectOpenFile } from "@/API/editor-api/editor-api.slice";

loader.config({ monaco });

export function ContentEditor() {
  const openFile = useAppSelector(selectOpenFile);

  return (
    <div className=" grow">
      {openFile ? (
        <Editor
          height="100%"
          theme="vs-dark"
          path={openFile.id}
          defaultLanguage={"yaml"}
          defaultValue={openFile.content}
        />
      ) : (
        " ???nothing opened"
      )}
    </div>
  );
}
