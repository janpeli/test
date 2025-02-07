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
  },
});

export const { updateFormData } = editorFormsSlice.actions;
export default editorFormsSlice.reducer;
