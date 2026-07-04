import {
  replacePlugins,
  replaceProjectStructureChildren,
} from "./project-api.slice";

import { store } from "@/app/store";
import { validateUuidInProjectStructure } from "./utils";
import { update_MAIN_SIDEBAR_PLUGINS_TREE } from "../GUI-api/main-sidebar-api";
import { addErrorMessage } from "../GUI-api/status-panel-api";
import { getProjectStructurebyId } from "./project-tree";

/**
 * Refreshes the list of plugins and updates the plugin tree in the sidebar.
 *
 * @returns {Promise<void>}
 */
export const refreshPlugins = async () => {
  const projectPath = store.getState().projectAPI.folderPath;
  if (!projectPath) {
    addErrorMessage(
      "Project is not initialized properly, plugins could not be refreshed",
      "error"
    );
    return;
  }
  const plugins = await window.project.getPlugins(projectPath);
  store.dispatch(replacePlugins(plugins));

  const fullProjectStructure = await window.project.getProjectStructure(projectPath);
  const pluginsSubtree = fullProjectStructure.children?.find(
    (child) => child.name === "plugins"
  );
  if (pluginsSubtree) {
    store.dispatch(
      replaceProjectStructureChildren({
        path: "plugins",
        projectStructure: pluginsSubtree,
      })
    );
  }
  update_MAIN_SIDEBAR_PLUGINS_TREE();
};

/**
 * Adds a plugin to the project by copying its data.
 *
 * @param {string} uuid - The UUID of the plugin to add.
 * @returns {Promise<void>}
 */
export const addPlugin = async (uuid: string) => {
  const plugins = store.getState().projectAPI.plugins;

  // Check if plugins is null or if plugin already exists
  if (!plugins || plugins.findIndex((p) => p.uuid === uuid) >= 0) {
    addErrorMessage(
      "Plugins are not initialized properly, or plugin is already part of this project",
      "error"
    );
    return;
  }

  const folderPath = store.getState().projectAPI.folderPath;
  if (!folderPath) {
    addErrorMessage(
      "Project is not initialized properly, plugins could not be added",
      "error"
    );
    return;
  }
  try {
    await window.project.copyPluginData({
      destinationFolderPath: folderPath,
      uuid,
    });
  } catch (error) {
    addErrorMessage((error as Error).message, "error");
    return;
  }

  refreshPlugins();
};

/**
 * Retrieves a list of available plugins.
 *
 * @returns {Promise<any>}
 */
export const getListOfPlugins = async () => {
  return await window.project.getListOfPlugins();
};

/**
 * Removes a plugin from the project.
 *
 * @param {string} uuid - The UUID of the plugin to remove.
 * @returns {Promise<void>}
 */
export const removePlugin = async (uuid: string) => {
  const plugins = store.getState().projectAPI.plugins;
  // Check if plugins is null or if plugin does not exist
  if (!plugins || plugins.findIndex((p) => p.uuid === uuid) == -1) {
    addErrorMessage(
      "Plugin was not removed, because it does not exist in the project.",
      "error"
    );
    return;
  }

  // models exist in project structure
  const models = getProjectStructurebyId("models");
  if (!models) {
    addErrorMessage(
      "Folder 'models' was not found in the project files.",
      "error"
    );
    return;
  }
  // there are files asociated with this plugin
  const uuidExists = validateUuidInProjectStructure(models, uuid);
  if (uuidExists) {
    addErrorMessage(
      "Plugin not removed: there are files asociated with this plugin.",
      "error"
    );
    return;
  }

  // get folder of the current project
  const folderPath = store.getState().projectAPI.folderPath;
  if (!folderPath) {
    addErrorMessage(
      "Project is not initialized properly, plugin could not be removed",
      "error"
    );
    return;
  }
  // delete plug in data
  try {
    await window.project.removePluginData({
      destinationFolderPath: folderPath,
      uuid,
    });
  } catch (error) {
    addErrorMessage((error as Error).message, "error");
    return;
  }

  refreshPlugins();
};

/**
 * Gets a list of active plugin UUIDs.
 *
 * @returns {string[] | undefined} An array of plugin UUIDs, or undefined if no plugins are loaded.
 */
export const getActivePlugins = () => {
  return store.getState().projectAPI.plugins?.map((plug) => plug.uuid);
};
