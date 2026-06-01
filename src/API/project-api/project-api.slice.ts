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
            if (!structure.children) structure.children = [];
            structure.children.push(action.payload.projectStructure);
          }
        }
      );
    },
    replaceProjectStructureChildren: (
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
            structure.children = action.payload.projectStructure.children;
          }
        }
      );
    },
    replacePlugins: (state, action: PayloadAction<Plugin[]>) => {
      state.plugins = action.payload;
    },
    updatePlugin: (state, action: PayloadAction<Plugin>) => {
      if (!state.plugins) return;
      const idx = state.plugins.findIndex((p) => p.uuid === action.payload.uuid);
      if (idx >= 0) {
        state.plugins[idx] = action.payload;
      }
    },
    // Renames a node in place: updates its display name and re-keys the node
    // and all of its descendants from the `oldId` prefix to `newId`. Mutating
    // in place (rather than re-fetching from disk) keeps unsaved in-memory
    // `isNew` files elsewhere in the tree intact.
    renameProjectStructure: (
      state,
      action: PayloadAction<{ oldId: string; newId: string; newName: string }>
    ) => {
      if (!state.projectStructure) return;
      const { oldId, newId, newName } = action.payload;

      function rekey(node: ProjectStructure) {
        node.id = newId + node.id.slice(oldId.length);
        node.children?.forEach(rekey);
      }

      function rename(node: ProjectStructure): boolean {
        if (node.id === oldId) {
          node.name = newName;
          rekey(node);
          return true;
        }
        if (!node.children) return false;
        for (const child of node.children) {
          if (rename(child)) return true;
        }
        return false;
      }

      rename(state.projectStructure);
    },
    removeProjectStructure: (state, action: PayloadAction<string>) => {
      if (!state.projectStructure) return;
      const targetId = action.payload;
      function removeFromNode(node: ProjectStructure): boolean {
        if (!node.children) return false;
        const idx = node.children.findIndex((c) => c.id === targetId);
        if (idx >= 0) {
          node.children.splice(idx, 1);
          return true;
        }
        for (const child of node.children) {
          if (removeFromNode(child)) return true;
        }
        return false;
      }
      removeFromNode(state.projectStructure);
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
  replacePlugins,
  updatePlugin,
  replaceProjectStructureChildren,
  renameProjectStructure,
  removeProjectStructure,
} = projectAPISlice.actions;

// Other code such as selectors can use the imported `RootState` type
