import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { getEditorFontSizeFromStorage } from "./editor-font-size-api";

interface EditorFontSizeState {
  fontSize: number;
}

const initialState: EditorFontSizeState = {
  fontSize: getEditorFontSizeFromStorage(),
};

export const editorFontSizeSlice = createSlice({
  name: "editorFontSize",
  initialState,
  reducers: {
    setEditorFontSize: (state, action: PayloadAction<number>) => {
      state.fontSize = action.payload;
    },
  },
});

export const { setEditorFontSize } = editorFontSizeSlice.actions;

export const selectEditorFontSize = (state: RootState) =>
  state.editorFontSizeAPI.fontSize;

export default editorFontSizeSlice.reducer;
