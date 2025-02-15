import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Plugin, ProjectStructure } from "electron/src/project";

// Define a type for the slice state
export interface ProjectAPIState {
  projectName: string | null;
  folderPath: string | null;
  projectStructure: ProjectStructure | null;
  plugins: Plugin[] | null;
  loading: boolean | null;
}

// Define the initial state using that type
const initialState: ProjectAPIState = {
  projectName: null,
  folderPath: null,
  projectStructure: null,
  plugins: null,
  loading: false,
};

export function traverseProjectStructure(
  node: ProjectStructure,
  callback: (node: ProjectStructure) => void
) {
  // Process current node
  callback(node);

  // Process children
  if (node.children) {
    node.children.forEach((child) => traverseProjectStructure(child, callback));
  }
}

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
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    addProjectStructure: (
      state,
      action: PayloadAction<{
        path: string;
        projectStructure: ProjectStructure;
      }>
    ) => {
      traverseProjectStructure(
        state.projectStructure as ProjectStructure,
        (structure) => {
          if (structure.id === action.payload.path) {
            structure.children?.push(action.payload.projectStructure);
          }
        }
      );
    },
  },
});

export default projectAPISlice.reducer;

export const {
  setProjectFolderPath,
  setProjectStructure,
  closeProject,
  setProject,
  setLoading,
  addProjectStructure,
} = projectAPISlice.actions;

// Other code such as selectors can use the imported `RootState` type
