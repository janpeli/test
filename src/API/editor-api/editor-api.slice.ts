import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { ParameterizedSelector } from "@/hooks/hooks";

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
interface EditorApiState {
  editors: EditorState[];
  activeEditorIdx: number | undefined;
}

interface EditorState {
  openFileId: string | undefined;
  editedFiles: EditedFile[];
  openFileHistory: string[];
}

// Define the initial state using that type
const initialState: EditorApiState = {
  editors: [],
  activeEditorIdx: undefined,
};

function createEditor(): EditorState {
  return {
    openFileId: undefined,
    editedFiles: [],
    openFileHistory: [],
  };
}

export const editorAPISlice = createSlice({
  name: "editorAPI",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setOpenFileId: (state, action: PayloadAction<string>) => {
      let found = 0;
      for (const editor of state.editors) {
        if (editor.editedFiles.some((file) => file.id === action.payload)) {
          editor.openFileId = action.payload;
          editor.openFileHistory.length !== 0
            ? editor.openFileHistory[editor.openFileHistory.length - 1] !==
                action.payload && editor.openFileHistory.push(action.payload)
            : editor.openFileHistory.push(action.payload);
          found += 1;
        }
      }
      if (!found) {
        throw new Error(`File ${action.payload} can not be opened`);
      }
    },
    addEditedFile: (state, action: PayloadAction<EditedFile>) => {
      if (!state.editors.length) {
        state.editors.push(createEditor());
      }
      state.activeEditorIdx = state.activeEditorIdx ? state.activeEditorIdx : 0;
      const editor = state.editors[state.activeEditorIdx];
      if (editor.editedFiles.some((file) => file.id === action.payload.id)) {
        editor.openFileId = action.payload.id;
        editor.openFileHistory.push(action.payload.id);
      } else {
        editor.editedFiles.push(action.payload);
        editor.openFileId = action.payload.id;
        editor.openFileHistory.push(action.payload.id);
      }
    },
    addEditedFileInOtherView: (state, action: PayloadAction<EditedFile>) => {
      const editorIdx = state.editors.push(createEditor()) - 1;

      state.activeEditorIdx = editorIdx;
      const editor = state.editors[editorIdx];

      editor.editedFiles.push(action.payload);
      editor.openFileId = action.payload.id;
      editor.openFileHistory.push(action.payload.id);
    },
    removeEditedFile: (state, action: PayloadAction<string>) => {
      for (const editor of state.editors) {
        if (editor.editedFiles.some((file) => file.id === action.payload)) {
          editor.editedFiles = editor.editedFiles.filter(
            (file) => file.id !== action.payload
          );
          editor.openFileHistory = editor.openFileHistory.filter(
            (id) => id !== action.payload
          );
          if (editor.openFileId == action.payload) {
            const newOpenFile = editor.openFileHistory.pop();
            editor.openFileId = newOpenFile;
          }
          if (!editor.editedFiles.length) {
            state.activeEditorIdx = state.editors.findIndex(
              (ed) => ed === editor
            );
          }
        }
      }

      state.editors = state.editors.filter(
        (editor) => editor.editedFiles.length !== 0
      );

      if (
        !state.activeEditorIdx ||
        state.editors.length - 1 < state.activeEditorIdx
      ) {
        state.activeEditorIdx = state.editors.length - 1;
      }
    },
    reorderEditedFile: (state, action: PayloadAction<Reorder>) => {
      const { anchorID, movedID } = action.payload;
      const editorMoved = state.editors.filter((editor) => {
        if (editor.editedFiles.some((file) => file.id === movedID)) {
          return true;
        }
        return false;
      })[0];

      const editorAnchor = state.editors.filter((editor) => {
        if (editor.editedFiles.some((file) => file.id === anchorID)) {
          return true;
        }
        return false;
      })[0];

      // Find indices of both files
      const movedIndex = editorMoved.editedFiles.findIndex(
        (file) => file.id === movedID
      );
      const anchorIndex = editorAnchor.editedFiles.findIndex(
        (file) => file.id === anchorID
      );

      // Return original state if either file is not found
      if (movedIndex === -1 || anchorIndex === -1) {
        return;
      }

      // Remove the moved file from its current position
      const [movedFile] = editorMoved.editedFiles.splice(movedIndex, 1);

      // Calculate the new insertion index
      // If the moved file was before the anchor, we need to adjust the anchor index
      const adjustedAnchorIndex = editorAnchor.editedFiles.findIndex(
        (file) => file.id === anchorID
      );

      // Insert the moved file before the anchor
      editorAnchor.editedFiles.splice(adjustedAnchorIndex, 0, movedFile);
      //state.editedFiles = newEditedFiles;

      state.activeEditorIdx = state.editors.findIndex(
        (editor) => editor === editorAnchor
      );

      state.editors = state.editors.filter(
        (editor) => editor.editedFiles.length !== 0
      );
    },
    reorderEditedFileThisLast: (state, action: PayloadAction<ReorderLast>) => {
      const { editorId, movedID } = action.payload;
      const editorMoved = state.editors.filter((editor) => {
        if (editor.editedFiles.some((file) => file.id === movedID)) {
          return true;
        }
        return false;
      })[0];

      const editorAnchor = state.editors[editorId];

      // Find indices of both files
      const movedIndex = editorMoved.editedFiles.findIndex(
        (file) => file.id === movedID
      );

      // Return original state if  file is not found
      if (movedIndex === -1 || !editorAnchor) {
        return;
      }

      // Remove the moved file from its current position
      const [movedFile] = editorMoved.editedFiles.splice(movedIndex, 1);

      // Insert the moved file before the anchor
      editorAnchor.editedFiles.push(movedFile);
      //state.editedFiles = newEditedFiles;

      state.activeEditorIdx = state.editors.findIndex(
        (editor) => editor === editorAnchor
      );

      state.editors = state.editors.filter(
        (editor) => editor.editedFiles.length !== 0
      );
    },
    closeEditor: (state) => {
      Object.entries(initialState).forEach(([key, value]) => {
        state[key as keyof EditorApiState] = value;
      });
    },
  },
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
