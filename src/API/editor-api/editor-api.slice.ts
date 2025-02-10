import { createSlice } from "@reduxjs/toolkit";
import reducers from "./editor-api.reducers";
//import { editor } from "monaco-editor";

/// EditorApiState by sa mal rozsirit terajsie attributy by sa mali posunut do vnutorneho ojectu a vzniknut by mal array... editors
/// pridat do editet file referenciu na monaco editor
/// pridat tam referenciu na model -- neda sa lebo neserializovatelny objekt spravi sa to inak

// Define a type for the slice state
export interface EditorApiState {
  editors: EditorState[];
  activeEditorIdx: number | undefined;
  openEditorHistory: number[];
}

export interface EditorState {
  openFileId: string | undefined;
  editedFiles: EditedFile[];
  openFileHistory: string[];
  editorIdx: number;
}

export interface EditedFile {
  id: string;
  name: string;
  content: string;
  path?: string;
  modes?: string[];
  models?: Record<string, string>;
  plugin_uuid: string;
  sufix: string;
}

export interface Reorder {
  anchorID: string;
  movedID: string;
}

export interface ReorderLast {
  editorId: number;
  movedID: string;
}

// Define the initial state using that type
export const initialState: EditorApiState = {
  editors: [],
  activeEditorIdx: undefined,
  openEditorHistory: [],
};

export const editorAPISlice = createSlice({
  name: "editorAPI",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: reducers,
});

export const {
  setEditorActive,
  setOpenFileId,
  addEditedFile,
  removeEditedFile,
  reorderEditedFile,
  reorderEditedFileThisLast,
  closeEditor,
  addEditedFileInOtherView,
} = editorAPISlice.actions;

export default editorAPISlice.reducer;
