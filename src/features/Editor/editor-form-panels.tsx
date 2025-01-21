import { EditorForm } from "./editor-from/editor-form";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import { selectEditedFiles } from "@/API/editor-api/editor-api.slice";

type EditorFormPanelsProps = {
  editorIdx: number;
};

export default function EditorFormPanels(props: EditorFormPanelsProps) {
  const editedFiles = useAppSelectorWithParams(selectEditedFiles, {
    editorIdx: props.editorIdx,
  });
  return (
    <>
      {editedFiles?.map(
        (file) =>
          file.plugin_uuid && (
            <EditorForm
              editorIdx={props.editorIdx}
              fileId={file.id}
              key={file.id}
            />
          )
      )}
    </>
  );
}
