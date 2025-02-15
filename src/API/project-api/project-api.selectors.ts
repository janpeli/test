import type { RootState } from "../../app/store";
import { ParameterizedSelector } from "@/hooks/hooks";
import { createSelector } from "@reduxjs/toolkit";
import { Plugin, ProjectStructure } from "electron/src/project";
import { findProjectStructureById, getPluginforFileID } from "./utils";

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
  if (!projectStructure) return;
  return getPluginforFileID(
    params.fileId,
    projectStructure,
    state.projectAPI.plugins as Plugin[]
  );
};

export const selectPluginForModal = (state: RootState) => {
  if (!state.modalAPI.id) return;
  const projectStructure = state.projectAPI.projectStructure;
  if (!projectStructure) return;
  return getPluginforFileID(
    state.modalAPI.id,
    projectStructure,
    state.projectAPI.plugins as Plugin[]
  );
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

export const selectProjectLoading = (state: RootState) =>
  state.projectAPI.loading;

export const selectProjectStructureBySufix = createSelector(
  [
    (state: RootState) => state.projectAPI.projectStructure,
    (_: RootState, params: { sufix: string[] }) => params.sufix,
  ],
  (projectStructure, sufix) => {
    if (!projectStructure) return null;

    const filterTree = (node: ProjectStructure): ProjectStructure | null => {
      // Check if the node matches the criteria
      const isMatch = sufix.includes(node.sufix);

      // Recursively filter children
      const filteredChildren = node.children
        ?.map(filterTree)
        .filter((child): child is ProjectStructure => child !== null);

      // Keep the node if it's a match or if it has matching descendants
      if (isMatch || (filteredChildren && filteredChildren.length > 0)) {
        return { ...node, children: filteredChildren };
      }

      return null;
    };

    return filterTree(projectStructure);
  }
);
