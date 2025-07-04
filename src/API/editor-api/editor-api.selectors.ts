import type { RootState } from "../../app/store";
import { ParameterizedSelector } from "@/hooks/hooks";
import { EditedFile, ScrollPosition } from "./editor-api.slice";
import { EditorMode } from "./editor-api.slice";

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

// Add this new selector to get the editor mode for a specific file
export const selectFileEditorMode = (
  state: RootState,
  params: { fileId: string }
): EditorMode | undefined => {
  const { fileId } = params;

  // Search through all editors for the file
  for (const editor of state.editorAPI.editors) {
    const file = editor.editedFiles.find((f) => f.id === fileId);
    if (file) {
      return file.editorMode;
    }
  }

  return undefined;
};

// Alternative selector that gets mode for the currently open file in a specific editor
export const selectOpenFileEditorMode = (
  state: RootState,
  params: { editorIdx: number }
): EditorMode | undefined => {
  const { editorIdx } = params;
  const editor = state.editorAPI.editors.find(
    (ed) => ed.editorIdx === editorIdx
  );

  if (!editor || !editor.openFileId) {
    return undefined;
  }

  const openFile = editor.editedFiles.find(
    (file) => file.id === editor.openFileId
  );
  return openFile?.editorMode;
};

export const selectFileScrollPosition: ParameterizedSelector<
  ScrollPosition | undefined,
  { editorIdx: number }
> = (state: RootState, params) => {
  const editor = state.editorAPI.editors.find(
    (ed) => ed.editorIdx === params.editorIdx
  );
  if (!editor) return;
  const fileId = state.editorAPI.editors.find(
    (ed) => ed.editorIdx === params.editorIdx
  )?.openFileId;
  const file = editor.editedFiles.find((file) => file.id === fileId);
  return file?.scrollPosition || undefined;
};
