import { createSlice } from "@reduxjs/toolkit";
import reducers from "./editor-api.reducers";

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

export type EditorModeType =
  | "SOURCE"
  | "FORM"
  | "MARKDOWN"
  | "PRODUCT"
  | "CANVAS"
  | "HISTORY";

export interface ScrollPosition {
  scrollTop: number;
  scrollLeft: number;
}

export interface EditedFile {
  id: string;
  name: string;
  content: string;
  path?: string;
  modes?: EditorModeType[];
  models?: Record<string, string>;
  plugin_uuid: string;
  sufix: string;
  activeViews: EditorModeType[];
  scrollPositions?: Partial<Record<EditorModeType, ScrollPosition>>;
  // Per-view flex-grow weights for the horizontal split. A view absent from the
  // map defaults to weight 1. Adjacent panes are resized by transferring weight
  // between the two neighbours, leaving every other pane's width untouched.
  paneSizes?: Partial<Record<EditorModeType, number>>;
  // Name of the product currently shown in the PRODUCT pane. Defaults to the
  // first product of the object type when the pane is first opened.
  activeProductName?: string;
  // True when the file has edits not yet written to disk. Set on source/form
  // edits, cleared on a successful save. Drives the italic tab name.
  isDirty?: boolean;
  // True when the SOURCE (Monaco) content is ahead of the parsed form data in
  // `editorForms[id]`. Set by Monaco edits (setFileContent `fromSource`), cleared
  // by markFormEdited and markFileSaved; saveEditedFile reads it to choose the
  // content over the serialized form.
  contentDirty?: boolean;
  // True when the file has been created in this session but never persisted to
  // disk. Cleared on the first successful save. Closing a still-new file
  // discards it entirely (removed from the project structure / treeview).
  isNew?: boolean;
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
  toggleFileActiveView,
  updateFileScrollPositionForMode,
  setFilePaneSizes,
  setFileContent,
  updateEditedFileId,
  setFileActiveProduct,
  setFileDirty,
  markFormEdited,
  markFileSaved,
} = editorAPISlice.actions;

export default editorAPISlice.reducer;
