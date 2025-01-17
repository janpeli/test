import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { ParameterizedSelector } from "@/hooks/hooks";
import reducers from "./editor-api.reducers";

/// EditorApiState by sa mal rozsirit terajsie attributy by sa mali posunut do vnutorneho ojectu a vzniknut by mal array... editors
/// pridat do editet file referenciu na monaco editor
/// pridat tam referenciu na model

export interface EditedFile {
  id: string;
  name: string;
  content: string;
  path?: string;
}

export interface Reorder {
  anchorID: string;
  movedID: string;
}

export interface ReorderLast {
  editorId: number;
  movedID: string;
}

// Define a type for the slice state
export interface EditorApiState {
  editors: EditorState[];
  activeEditorIdx: number | undefined;
}

export interface EditorState {
  openFileId: string | undefined;
  editedFiles: EditedFile[];
  openFileHistory: string[];
}

// Define the initial state using that type
export const initialState: EditorApiState = {
  editors: [],
  activeEditorIdx: undefined,
};

export const editorAPISlice = createSlice({
  name: "editorAPI",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: reducers,
});

export const {
  setOpenFileId,
  addEditedFile,
  removeEditedFile,
  reorderEditedFile,
  reorderEditedFileThisLast,
  closeEditor,
  addEditedFileInOtherView,
} = editorAPISlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectEditedFiles: ParameterizedSelector<
  EditedFile[],
  { editorIdx: number }
> = (state: RootState, params: { editorIdx: number }) =>
  state.editorAPI.editors[params.editorIdx].editedFiles;

export const selectOpenFileId: ParameterizedSelector<
  string | undefined,
  { editorIdx: number }
> = (state: RootState, params) => {
  return state.editorAPI.editors[params.editorIdx].openFileId;
};

export const selectOpenFile: ParameterizedSelector<
  EditedFile | undefined,
  { editorIdx: number }
> = (state: RootState, params) =>
  state.editorAPI.editors[params.editorIdx].editedFiles.find(
    (obj) => obj["id"] === state.editorAPI.editors[params.editorIdx].openFileId
  );

export const selectEditorActiveIdx = (state: RootState) => {
  return state.editorAPI.activeEditorIdx;
};

export const selectEditors = (state: RootState) => {
  return state.editorAPI.editors;
};

export default editorAPISlice.reducer;
