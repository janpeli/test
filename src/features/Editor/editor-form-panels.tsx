import EditorForm from "./editor-from/editor-form";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import {
  selectEditedFiles,
  selectOpenFileId,
} from "@/API/editor-api/editor-api.slice";
import { cn } from "@/lib/utils";

type EditorFormPanelsProps = {
  editorIdx: number;
};

export default function EditorFormPanels(props: EditorFormPanelsProps) {
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
}
