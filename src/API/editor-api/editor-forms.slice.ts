import { IdefValues } from "@/features/Editor/utilities";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type FormState = {
  [formID: string]: IdefValues;
};

const initialState: FormState = {};

export const editorFormsSlice = createSlice({
  name: "editorForms",
  initialState,
  reducers: {
    updateFormData: (state, action: PayloadAction<Partial<FormState>>) => {
      Object.keys(action.payload).forEach((formID) => {
        const newData = action.payload[formID];
        if (!state[formID]) state[formID] = {};
        if (newData) state[formID] = structuredClone(newData);
      });
    },
    removeForm: (state, action: PayloadAction<string>) => {
      if (state[action.payload]) delete state[action.payload];
    },
    // Re-keys form data when a file/folder is moved. Handles both the exact id
    // and any nested ids (folder moves) sharing the `oldId + "/"` prefix.
    renameFormId: (
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
  },
});

export const { updateFormData, removeForm, renameFormId } =
  editorFormsSlice.actions;
export default editorFormsSlice.reducer;
