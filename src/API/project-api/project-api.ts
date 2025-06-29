import {
  setProject,
  closeProject as closeProjectReducer,
  ProjectAPIState,
  setLoading,
  replacePlugins,
  replaceProjectStructureChildren,
} from "./project-api.slice";

import { store } from "@/app/store";
import { closeEditor } from "../editor-api/editor-api.slice";
import { ProjectStructure } from "electron/src/project";
import {
  findProjectStructureById,
  validateUuidInProjectStructure,
} from "./utils";
import { update_MAIN_SIDEBAR_PLUGINS_TREE } from "../GUI-api/main-sidebar-api";
import { clearActiveContext } from "../GUI-api/active-context.slice";

/**
 * Opens a project from a specified folder, or prompts the user to select a folder if none is provided.
 *
 * @param {string} [folder] - The path to the project folder. If not provided, a folder selection dialog will be opened.
 * @returns {Promise<void>}
 */
export const openProject = async (folder?: string) => {
  try {
    store.dispatch(setLoading(true));
    const selectedFolder = folder
      ? folder
      : await window.project.openFolderDialog();

    if (selectedFolder) {
      const project: ProjectAPIState = {
        projectName: null,
        projectStructure: null,
        folderPath: selectedFolder,
        plugins: null,
        loading: false,
      };

      project.projectStructure = await window.project.getProjectStructure(
        selectedFolder
      );

      project.projectName = await window.project.getProjectName(selectedFolder);

      if (project.projectName === "")
        console.error(
          "Project does not specify project_name property in /project.yaml file."
        );

      project.plugins = await window.project.getPlugins(selectedFolder);
      store.dispatch(setProject(project));
      console.log("project ", project);
    } else {
      store.dispatch(setLoading(false));
    }
  } catch (error) {
    console.error("Error:", (error as Error).message);
    store.dispatch(closeProjectReducer());
  }
};

/**
 * Closes the currently open project.  Dispatches actions to close the editor and project.
 *
 * @returns {Promise<void>}
 */
export const closeProject = async () => {
  store.dispatch(closeEditor());
  store.dispatch(closeProjectReducer());
  store.dispatch(clearActiveContext());
};

/**
 * Creates a new project in the specified folder with the given project name.
 *
 * @param {string} folder - The path to the folder where the project should be created.
 * @param {string} projectName - The name of the project.
 * @returns {Promise<void>}
 */
export const createProject = async (folder: string, projectName: string) => {
  try {
    await closeProject();
    store.dispatch(setLoading(true));
    await window.project.createProject({ folderPath: folder, projectName });
    await openProject(folder);
  } catch (error) {
    console.error("Error:", (error as Error).message);
    store.dispatch(closeProjectReducer());
  }
};

/**
 * Filters the project structure based on a list of file suffixes.
 *
 * @param {string[]} sufix - An array of file suffixes to filter by.
 * @returns {ProjectStructure | null} The filtered project structure, or null if the project structure is not loaded.
 */
export const getProjectStructureFiltered = (sufix: string[]) => {
  const projectStructure = store.getState().projectAPI
    .projectStructure as ProjectStructure;
  if (!projectStructure) return null;

  /**
   * Recursively filters the project structure tree.
   *
   * @param {ProjectStructure} node - The current node in the project structure.
   * @returns {ProjectStructure | null} The filtered node, or null if it doesn't match the criteria.
   */
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
};

/**
 * Retrieves a project structure node by its ID.
 *
 * @param {string} id - The ID of the project structure node to retrieve.
 * @returns {ProjectStructure | null} The project structure node, or null if not found.
 */
export const getProjectStructurebyId = (id: string) => {
  const projectStructure = store.getState().projectAPI.projectStructure;
  if (projectStructure) return findProjectStructureById(projectStructure, id);
  return null;
};

/**
 * Creates a new folder within the project.
 *
 * @param {string} relativeFolderPath - The relative path to the new folder within the project.
 * @returns {Promise<void>}
 * @throws {Error} If the project is not properly open.
 */
export const createFolder = async (relativeFolderPath: string) => {
  try {
    const projectPath = store.getState().projectAPI.folderPath;
    if (!projectPath) {
      throw new Error("Can't create folder if Project is not properly open");
    }
    return await window.project.createFolder({
      projectPath,
      relativeFolderPath,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
  }
};

/**
 * Refreshes the list of plugins and updates the plugin tree in the sidebar.
 *
 * @returns {Promise<void>}
 */
export const refreshPlugins = async () => {
  const projectPath = store.getState().projectAPI.folderPath;
  if (!projectPath) return;
  const plugins = await window.project.getPlugins(projectPath);
  store.dispatch(replacePlugins(plugins));

  const projectStructurePlugins = await window.project.getProjectStructure(
    projectPath + "\\plugins"
  );
  projectStructurePlugins.id = "plugins";
  projectStructurePlugins.name = "plugins";
  store.dispatch(
    replaceProjectStructureChildren({
      path: "plugins",
      projectStructure: projectStructurePlugins,
    })
  );
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
  console.log({ plugins });
  // Check if plugins is null or if plugin already exists
  if (!plugins || plugins.findIndex((p) => p.uuid === uuid) >= 0) {
    return;
  }

  const folderPath = store.getState().projectAPI.folderPath;
  if (!folderPath) return;

  await window.project.copyPluginData({
    destinationFolderPath: folderPath,
    uuid,
  });

  refreshPlugins();
  console.log({ folderPath, uuid });
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
    return;
  }

  // models exist in project structure
  const models = getProjectStructurebyId("models");
  if (!models) return;

  // there are files asociated with this plugin
  const uuidExists = validateUuidInProjectStructure(models, uuid);
  if (uuidExists) return;

  // get folder of the current project
  const folderPath = store.getState().projectAPI.folderPath;
  if (!folderPath) return;

  // delete plug in data
  await window.project.removePluginData({
    destinationFolderPath: folderPath,
    uuid,
  });

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
