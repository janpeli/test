import { IdefValues } from "@/features/Editor/utilities";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type FormState = {
  [formID: string]: IdefValues;
};

// Utility function for deep merging objects (ensures only relevant fields are updated)
const mergeDeep = (target: IdefValues, source: IdefValues) => {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(
        source[key],
        mergeDeep(target[key] as IdefValues, source[key] as IdefValues)
      );
    }
  }
  return { ...target, ...source };
};

const initialState: FormState = {};

export const editorFormsSlice = createSlice({
  name: "editorForms",
  initialState,
  reducers: {
    updateFormData: (state, action: PayloadAction<Partial<FormState>>) => {
      Object.keys(action.payload).forEach((formID) => {
        if (!state[formID]) state[formID] = {};
        if (!action.payload[formID]) return;
        state[formID] = mergeDeep(state[formID], action.payload[formID]);
      });
    },
  },
});

export const { updateFormData } = editorFormsSlice.actions;
export default editorFormsSlice.reducer;
