import { RootState } from "@/app/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ErrorListMessage = { type: "info" | "warning" | "error"; message: string };

// Define a type for the slice state
interface StatusPanelState {
  showPanel: boolean;
  outputList: string[];
  errorList: ErrorListMessage[];
  activeList: "Output" | "Error";
}

// Define the initial state using that type
const initialState: StatusPanelState = {
  showPanel: false,
  outputList: [],
  errorList: [],
  activeList: "Output",
};

export const statusPanelSlice = createSlice({
  name: "statusPanel",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    togglePanel: (state) => {
      state.showPanel = !state.showPanel;
    },
    // Use the PayloadAction type to declare the contents of `action.payload`
    addErrorListMessage: (state, action: PayloadAction<ErrorListMessage>) => {
      state.errorList.push(action.payload);
    },
    addOutputListMessage: (state, action: PayloadAction<string>) => {
      state.outputList.push(action.payload);
    },
    clearPanel: (state) => {
      Object.entries(initialState).forEach(([key, value]) => {
        // @ts-expect-error: Dynamic assignment from initialState
        state[key as keyof StatusPanelState] = value;
      });
    },
    setActiveList: (state, action: PayloadAction<"Output" | "Error">) => {
      state.activeList = action.payload;
    },
  },
});

export const {
  togglePanel,
  addErrorListMessage,
  addOutputListMessage,
  clearPanel,
  setActiveList,
} = statusPanelSlice.actions;

export const selectShowStatusPanel = (state: RootState) =>
  state.statusPanel.showPanel;
export const selectOutputList = (state: RootState) =>
  state.statusPanel.outputList;
export const selectErrorList = (state: RootState) =>
  state.statusPanel.errorList;
export const selectActiveList = (state: RootState) =>
  state.statusPanel.activeList;

export default statusPanelSlice.reducer;
