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
        if (!state[formID]) state[formID] = {};

        if (action.payload[formID])
          state[formID] = structuredClone(action.payload[formID]); // Use deepMerge here
      });
    },
    removeForm: (state, action: PayloadAction<string>) => {
      if (state[action.payload]) delete state[action.payload];
    },
  },
});

export const { updateFormData, removeForm } = editorFormsSlice.actions;
export default editorFormsSlice.reducer;
