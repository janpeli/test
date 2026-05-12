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
  },
});

export const { updateFormData, removeForm } = editorFormsSlice.actions;
export default editorFormsSlice.reducer;
