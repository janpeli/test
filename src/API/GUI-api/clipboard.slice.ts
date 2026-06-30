import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";

// A read-only *mirror* of the tree clipboard so React UI (the menubar's Edit
// menu) can reactively enable/disable Paste and show the item count. The
// authoritative clipboard still lives on the TreeController instances; they push
// changes here via their onClipboardChange callback. `mode` decides whether a
// paste copies or moves the captured ids.
interface ClipboardState {
  ids: string[];
  mode: "copy" | "cut" | null;
}

const initialState: ClipboardState = {
  ids: [],
  mode: null,
};

export const clipboardSlice = createSlice({
  name: "clipboard",
  initialState,
  reducers: {
    setClipboardMirror: (
      state,
      action: PayloadAction<{ ids: string[]; mode: "copy" | "cut" }>
    ) => {
      state.ids = action.payload.ids;
      state.mode = action.payload.mode;
    },
    clearClipboardMirror: (state) => {
      state.ids = [];
      state.mode = null;
    },
  },
});

export const { setClipboardMirror, clearClipboardMirror } =
  clipboardSlice.actions;

export const selectClipboard = (state: RootState) => state.clipboard;

export default clipboardSlice.reducer;
