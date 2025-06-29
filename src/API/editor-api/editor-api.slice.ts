// Updated editor-api.slice.ts
import { createSlice } from "@reduxjs/toolkit";
import reducers from "./editor-api.reducers";

export type EditorMode = "YAML" | "FORM";

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

// Type definition for scroll position
export interface ScrollPosition {
  scrollTop: number;
  scrollLeft: number;
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
  editorMode: EditorMode;
  scrollPosition?: ScrollPosition;
}

export interface Reorder {
  anchorID: string;
  movedID: string;
}

export interface ReorderLast {
  editorId: number;
  movedID: string;
}

export const initialState: EditorApiState = {
  editors: [],
  activeEditorIdx: undefined,
  openEditorHistory: [],
};

export const editorAPISlice = createSlice({
  name: "editorAPI",
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
  setFileEditorMode,
  updateFileScrollPosition,
} = editorAPISlice.actions;

export default editorAPISlice.reducer;
