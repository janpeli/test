import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";

export interface EditedFile {
  id: string;
  name: string;
  content: string;
}

// Define a type for the slice state
interface EditorApiState {
  openFileId: string | null;
  editedFiles: EditedFile[];
  openFileHistory: string[];
}

// Define the initial state using that type
const initialState: EditorApiState = {
  openFileId: null,
  editedFiles: [],
  openFileHistory: [],
};

export const editorAPISlice = createSlice({
  name: "editorAPI",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setOpenFileId: (state, action: PayloadAction<string>) => {
      if (state.editedFiles.some((file) => file.id === action.payload)) {
        state.openFileId = action.payload;
        state.openFileHistory.length !== 0
          ? state.openFileHistory[state.openFileHistory.length - 1] !==
              action.payload && state.openFileHistory.push(action.payload)
          : state.openFileHistory.push(action.payload);
      } else {
        throw new Error(`File ${action.payload} can not be opened`);
      }
    },
    addEditedFile: (state, action: PayloadAction<EditedFile>) => {
      if (state.editedFiles.some((file) => file.id === action.payload.id)) {
        null;
      } else {
        state.editedFiles.push(action.payload);
        state.openFileId = action.payload.id;
        state.openFileHistory.push(action.payload.id);
      }
    },
    removeEditedFile: (state, action: PayloadAction<string>) => {
      state.editedFiles = state.editedFiles.filter(
        (file) => file.id !== action.payload
      );
      state.openFileHistory = state.openFileHistory.filter(
        (id) => id !== action.payload
      );
      if (state.openFileId == action.payload) {
        const newOpenFile = state.openFileHistory.pop();
        state.openFileId = newOpenFile ? newOpenFile : null;
      }
    },
  },
});

export const { setOpenFileId, addEditedFile, removeEditedFile } =
  editorAPISlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectEditedFiles = (state: RootState) =>
  state.editorAPI.editedFiles;

export const selectOpenFileId = (state: RootState) =>
  state.editorAPI.openFileId;

export default editorAPISlice.reducer;
