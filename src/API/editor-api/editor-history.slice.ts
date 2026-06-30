import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IdefValues } from "@/features/Editor/utilities";

// Per-file FORM undo/redo. A snapshot is a whole-form value; `editorForms[fileId]`
// is the "present", this slice holds only the surrounding history:
//   past   = older states (oldest → most-recent-before-present)
//   future = undone states, replayed by redo
// SOURCE (Monaco) text edits are NOT tracked here — Monaco owns its native undo
// stack (see undo-redo-plan.md, Phase 1).
export type FormSnapshot = IdefValues;

interface FileHistory {
  past: FormSnapshot[];
  future: FormSnapshot[];
}

type HistoryState = { [fileId: string]: FileHistory };

// Bound per-file history so a long editing session can't grow memory without
// limit. Form edits are coarse (one step per field blur), so this is generous.
const MAX_HISTORY = 100;

const initialState: HistoryState = {};

export const editorHistorySlice = createSlice({
  name: "editorHistory",
  initialState,
  reducers: {
    // Records the pre-edit snapshot as a new undo step and clears the redo stack
    // (a fresh edit invalidates any previously-undone future).
    recordFormHistory: (
      state,
      action: PayloadAction<{ fileId: string; snapshot: FormSnapshot }>
    ) => {
      const { fileId, snapshot } = action.payload;
      if (!state[fileId]) state[fileId] = { past: [], future: [] };
      const h = state[fileId];
      h.past.push(snapshot);
      if (h.past.length > MAX_HISTORY) h.past.shift();
      h.future = [];
    },
    // Undo: caller applies the latest past entry as the present; the supplied
    // current present is stashed for redo.
    undoFormHistory: (
      state,
      action: PayloadAction<{ fileId: string; present: FormSnapshot }>
    ) => {
      const h = state[action.payload.fileId];
      if (!h || h.past.length === 0) return;
      h.past.pop();
      h.future.push(action.payload.present);
    },
    // Redo: mirror of undo.
    redoFormHistory: (
      state,
      action: PayloadAction<{ fileId: string; present: FormSnapshot }>
    ) => {
      const h = state[action.payload.fileId];
      if (!h || h.future.length === 0) return;
      h.future.pop();
      h.past.push(action.payload.present);
    },
    clearFormHistory: (state, action: PayloadAction<string>) => {
      if (action.payload in state) delete state[action.payload];
    },
    // Re-key on file/folder move or rename. Handles the exact id and any nested
    // ids sharing the `oldId + "/"` prefix (folder moves), matching renameFormId.
    renameFormHistoryId: (
      state,
      action: PayloadAction<{ oldId: string; newId: string }>
    ) => {
      const { oldId, newId } = action.payload;
      const prefix = oldId + "/";
      Object.keys(state).forEach((key) => {
        if (key === oldId) {
          state[newId] = state[key];
          delete state[key];
        } else if (key.startsWith(prefix)) {
          state[newId + key.slice(oldId.length)] = state[key];
          delete state[key];
        }
      });
    },
    clearAllFormHistory: () => {
      return {};
    },
  },
});

export const {
  recordFormHistory,
  undoFormHistory,
  redoFormHistory,
  clearFormHistory,
  renameFormHistoryId,
  clearAllFormHistory,
} = editorHistorySlice.actions;
export default editorHistorySlice.reducer;
