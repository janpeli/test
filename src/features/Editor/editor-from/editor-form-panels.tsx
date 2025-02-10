import EditorForm from "./editor-form";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import {
  selectEditedFiles,
  selectOpenFileId,
} from "@/API/editor-api/editor-api.selectors";
import { cn } from "@/lib/utils";
import React from "react";

type EditorFormPanelsProps = {
  editorIdx: number;
};

const EditorFormPanels = React.memo(function EditorFormPanels(
  props: EditorFormPanelsProps
) {
  const editedFiles = useAppSelectorWithParams(selectEditedFiles, {
    editorIdx: props.editorIdx,
  });

  const openFileID = useAppSelectorWithParams(selectOpenFileId, {
    editorIdx: props.editorIdx,
  });
  return editedFiles?.map(
    (file) =>
      file.plugin_uuid && (
        <div
          key={file.id}
          className={cn(openFileID === file.id ? "flex flex-col" : "hidden")}
        >
          <EditorForm
            editorIdx={props.editorIdx}
            fileId={file.id}
            key={file.id}
          />
        </div>
      )
  );
});

EditorFormPanels.displayName = "EditorFormPanels";
export default EditorFormPanels;
