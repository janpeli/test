import type { RootState } from "../../app/store";
import { ParameterizedSelector } from "@/hooks/hooks";
import { EditedFile } from "./editor-api.slice";

// Other code such as selectors can use the imported `RootState` type
export const selectEditedFiles: ParameterizedSelector<
  EditedFile[] | undefined,
  { editorIdx: number }
> = (state: RootState, params: { editorIdx: number }) => {
  return state.editorAPI.editors.find((ed) => ed.editorIdx === params.editorIdx)
    ?.editedFiles;
};

export const selectOpenFileId: ParameterizedSelector<
  string | undefined,
  { editorIdx: number }
> = (state: RootState, params) => {
  return state.editorAPI.editors.find((ed) => ed.editorIdx === params.editorIdx)
    ?.openFileId;
};

export const selectOpenFile: ParameterizedSelector<
  EditedFile | undefined,
  { editorIdx: number }
> = (state: RootState, params) => {
  const editor = state.editorAPI.editors.find(
    (ed) => ed.editorIdx === params.editorIdx
  );
  if (!editor) return;
  return editor.editedFiles.find((file) => file.id === editor.openFileId);
};

export const selectFile: ParameterizedSelector<
  EditedFile | undefined,
  { editorIdx: number; fileId: string }
> = (state: RootState, params) => {
  const editor = state.editorAPI.editors.find(
    (ed) => ed.editorIdx === params.editorIdx
  );
  if (!editor) return;
  return editor.editedFiles.find((file) => file.id === params.fileId);
};

export const selectFileContent: ParameterizedSelector<
  string | undefined,
  { editorIdx: number; fileId: string }
> = (state: RootState, params) => {
  const editor = state.editorAPI.editors.find(
    (ed) => ed.editorIdx === params.editorIdx
  );
  if (!editor) return;
  return editor.editedFiles.find((file) => file.id === params.fileId)?.content;
};

export const selectOpenFileContent: ParameterizedSelector<
  string | undefined,
  { editorIdx: number }
> = (state: RootState, params) => {
  const editor = state.editorAPI.editors.find(
    (ed) => ed.editorIdx === params.editorIdx
  );
  if (!editor) return;
  return editor.editedFiles.find((file) => file.id === editor.openFileId)
    ?.content;
};

export const selectEditorActiveIdx = (state: RootState) => {
  return state.editorAPI.activeEditorIdx;
};

export const selectEditorOpenHistory = (state: RootState) => {
  return state.editorAPI.openEditorHistory;
};

export const selectEditors = (state: RootState) => {
  return state.editorAPI.editors;
};

export const selectEditorsLength = (state: RootState) => {
  return state.editorAPI.editors.length;
};

export const selectEditedFilesIds: ParameterizedSelector<
  string[] | undefined,
  { editorIdx: number }
> = (state: RootState, params: { editorIdx: number }) => {
  return state.editorAPI.editors
    .find((ed) => ed.editorIdx === params.editorIdx)
    ?.editedFiles.map((file) => file.id);
};
