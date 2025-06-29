import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";

// Define a type for the slice state
interface ActiveContextState {
  idProjectNode?: string;
  idProjectFolder?: string;
}

// Define the initial state using that type
const initialState: ActiveContextState = {
  idProjectNode: undefined,
  idProjectFolder: undefined,
};

export const activeContextSlice = createSlice({
  name: "activeContext",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    // Use the PayloadAction type to declare the contents of `action.payload`
    setIdProjectNode: (state, action: PayloadAction<string>) => {
      state.idProjectNode = action.payload;
    },
    setIdProjectFolder: (state, action: PayloadAction<string>) => {
      state.idProjectFolder = action.payload;
    },
    clearActiveContext: (state) => {
      Object.entries(initialState).forEach(([key, value]) => {
        state[key as keyof ActiveContextState] = value;
      });
    },
  },
});

export const { setIdProjectNode, setIdProjectFolder, clearActiveContext } =
  activeContextSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectActiveIdProjectNode = (state: RootState) =>
  state.activeContext.idProjectNode;

export const selectActiveIdProjectFolder = (state: RootState) =>
  state.activeContext.idProjectFolder;

export default activeContextSlice.reducer;
