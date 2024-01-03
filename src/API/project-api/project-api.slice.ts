import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { ProjectStructure } from "electron/src/project";

// Define a type for the slice state
interface ProjectAPIState {
  folderPath: string | null;
  projectStructure: ProjectStructure | null;
}

// Define the initial state using that type
const initialState: ProjectAPIState = {
  folderPath: null,
  projectStructure: null,
};

export const projectAPISlice = createSlice({
  name: "projectAPI",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    // Use the PayloadAction type to declare the contents of `action.payload`
    setProjectFolderPath: (state, action: PayloadAction<string>) => {
      state.folderPath = action.payload;
    },
    setProjectStructure: (state, action: PayloadAction<ProjectStructure>) => {
      state.projectStructure = action.payload;
    },
  },
});

export const { setProjectFolderPath, setProjectStructure } =
  projectAPISlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectProjectPath = (state: RootState) =>
  state.projectAPI.folderPath;

export const selectProjectStructure = (state: RootState) =>
  state.projectAPI.projectStructure;

export default projectAPISlice.reducer;
