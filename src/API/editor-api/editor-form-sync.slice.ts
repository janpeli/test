import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Per-file counter bumped when `editorForms[fileId]` is replaced from an external
// source (SOURCE->FORM live sync, save reconcile, undo/redo), NOT by in-form field
// commits. EditorFormPanels folds it into each EditorForm's React `key` so an
// external write remounts the form — the only way to refresh fields that snapshot
// their value at mount (TagField/ComboboxField; see editor-form.tsx). Must bump
// ONLY on external writes — bumping on keystroke/blur would remount mid-edit.
type FormSyncState = { [fileId: string]: number };

const initialState: FormSyncState = {};

export const formSyncSlice = createSlice({
  name: "formSync",
  initialState,
  reducers: {
    bumpFormSync: (state, action: PayloadAction<string>) => {
      state[action.payload] = (state[action.payload] ?? 0) + 1;
    },
    clearFormSync: (state, action: PayloadAction<string>) => {
      if (action.payload in state) delete state[action.payload];
    },
  },
});

export const { bumpFormSync, clearFormSync } = formSyncSlice.actions;
export default formSyncSlice.reducer;
