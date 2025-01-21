import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { Plugin, ProjectStructure } from "electron/src/project";

// Define a type for the slice state
export interface ProjectAPIState {
  projectName: string | null;
  folderPath: string | null;
  projectStructure: ProjectStructure | null;
  plugins: Plugin[] | null;
}

// Define the initial state using that type
const initialState: ProjectAPIState = {
  projectName: null,
  folderPath: null,
  projectStructure: null,
  plugins: null,
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
    setProject: (state, action: PayloadAction<ProjectAPIState>) => {
      Object.entries(action.payload).forEach(([key, value]) => {
        state[key as keyof ProjectAPIState] = value;
      });
    },
    closeProject: (state) => {
      Object.entries(initialState).forEach(([key, value]) => {
        state[key as keyof ProjectAPIState] = value;
      });
    },
  },
});

export const {
  setProjectFolderPath,
  setProjectStructure,
  closeProject,
  setProject,
} = projectAPISlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectProjectPath = (state: RootState) =>
  state.projectAPI.folderPath;

export const selectProjectName = (state: RootState) =>
  state.projectAPI.projectName;

export const selectProjectStructure = (state: RootState) =>
  state.projectAPI.projectStructure;

export const selectProjectStructureforModels = (state: RootState) => {
  const projectStructure = state.projectAPI.projectStructure;

  if (!projectStructure?.children) {
    return null;
  }

  return (
    projectStructure.children.find((child) => child.name === "models") || null
  );
};

export const selectProjectStructureforPlugins = (state: RootState) => {
  const projectStructure = state.projectAPI.projectStructure;

  if (!projectStructure?.children) {
    return null;
  }

  return (
    projectStructure.children.find((child) => child.name === "plugins") || null
  );
};

export default projectAPISlice.reducer;
