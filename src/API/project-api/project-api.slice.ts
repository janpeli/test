import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { Plugin, ProjectStructure } from "electron/src/project";
import { ParameterizedSelector } from "@/hooks/hooks";

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

export default projectAPISlice.reducer;

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

export function findProjectStructureById(
  structure: ProjectStructure,
  targetId: string
): ProjectStructure | null {
  // If current node matches the target ID, return it
  if (structure.id === targetId) {
    return structure;
  }

  // If current node has no children or isn't a folder, return null
  if (!structure.children || !structure.isFolder) {
    return null;
  }

  // Search through children
  for (const child of structure.children) {
    const result = findProjectStructureById(child, targetId);
    if (result) {
      return result;
    }
  }

  return null;
}

export const selectProjectStructureById: ParameterizedSelector<
  ProjectStructure | null,
  { fileId: string }
> = (state: RootState, params: { fileId: string }) => {
  const projectStructure = state.projectAPI.projectStructure;
  if (projectStructure)
    return findProjectStructureById(projectStructure, params.fileId);
  return null;
};

export const selectPluginByUUID: ParameterizedSelector<
  Plugin | undefined,
  { UUID: string }
> = (state: RootState, params: { UUID: string }) => {
  return state.projectAPI.plugins?.find(
    (plugin) => plugin.uuid === params.UUID
  );
};

export const selectPluginByFileId: ParameterizedSelector<
  Plugin | undefined,
  { fileId: string }
> = (state: RootState, params: { fileId: string }) => {
  const projectStructure = state.projectAPI.projectStructure;
  let UUID = "";
  if (projectStructure)
    UUID = findProjectStructureById(projectStructure, params.fileId)
      ?.plugin_uuid as string;

  return state.projectAPI.plugins?.find((plugin) => plugin.uuid === UUID);
};

export const selectSchemaByFileId: ParameterizedSelector<
  string,
  { fileId: string }
> = (state: RootState, params: { fileId: string }) => {
  if (!state.projectAPI.projectStructure || !state.projectAPI.plugins)
    return "";

  const file = findProjectStructureById(
    state.projectAPI.projectStructure,
    params.fileId
  );
  if (!file) return "";

  const plugin = state.projectAPI.plugins.find(
    (plugin) => plugin.uuid === file.plugin_uuid
  );
  if (!plugin) return "";

  if (file.sufix === "mdl") {
    return plugin.model_schema;
  }

  const base_object = plugin.base_objects.find(
    (obj) => obj.sufix === file.sufix
  );
  if (!base_object) return "";

  return base_object.definition;
};
