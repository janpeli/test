import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";

export interface EditedFile {
  id: string;
  name: string;
  content: string;
}

export interface Reorder {
  anchorID: string;
  movedID: string;
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
        state.openFileId = action.payload.id;
        state.openFileHistory.push(action.payload.id);
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
    reorderEditedFile: (state, action: PayloadAction<Reorder>) => {
      const { editedFiles } = state;
      const { anchorID, movedID } = action.payload;

      // Find indices of both files
      const movedIndex = editedFiles.findIndex((file) => file.id === movedID);
      const anchorIndex = editedFiles.findIndex((file) => file.id === anchorID);

      // Return original state if either file is not found
      if (movedIndex === -1 || anchorIndex === -1) {
        return;
      }

      // Create a copy of the editedFiles array
      const newEditedFiles = [...editedFiles];

      // Remove the moved file from its current position
      const [movedFile] = newEditedFiles.splice(movedIndex, 1);

      // Calculate the new insertion index
      // If the moved file was before the anchor, we need to adjust the anchor index
      const adjustedAnchorIndex =
        movedIndex < anchorIndex ? anchorIndex - 1 : anchorIndex;

      // Insert the moved file before the anchor
      newEditedFiles.splice(adjustedAnchorIndex, 0, movedFile);
      state.editedFiles = newEditedFiles;
    },
    reorderEditedFileThisLast: (state, action: PayloadAction<string>) => {
      const { editedFiles } = state;
      const movedID = action.payload;

      const movedIndex = editedFiles.findIndex((file) => file.id === movedID);
      // Return original state if file is not found or it is already last
      if (movedIndex === -1 || movedIndex + 1 === editedFiles.length) {
        return;
      }

      // Create a copy of the editedFiles array
      const newEditedFiles = [...editedFiles];

      // Remove the moved file from its current position
      const [movedFile] = newEditedFiles.splice(movedIndex, 1);

      // Insert the moved file before the anchor
      newEditedFiles.push(movedFile);
      state.editedFiles = newEditedFiles;
    },
  },
});

export const {
  setOpenFileId,
  addEditedFile,
  removeEditedFile,
  reorderEditedFile,
  reorderEditedFileThisLast,
} = editorAPISlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectEditedFiles = (state: RootState) =>
  state.editorAPI.editedFiles;

export const selectOpenFileId = (state: RootState) =>
  state.editorAPI.openFileId;

export const selectOpenFile = (state: RootState) =>
  state.editorAPI.editedFiles.find(
    (obj) => obj["id"] === state.editorAPI.openFileId
  );

export default editorAPISlice.reducer;
