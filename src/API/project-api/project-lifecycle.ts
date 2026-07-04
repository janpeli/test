import {
  setProject,
  closeProject as closeProjectReducer,
  ProjectAPIState,
  setLoading,
} from "./project-api.slice";

import { store } from "@/app/store";
import { closeEditor } from "../editor-api/editor-api.slice";
import { clearActiveContext } from "../GUI-api/active-context.slice";
import { addErrorMessage, addOutputMessage } from "../GUI-api/status-panel-api";
import { clearAllFormHistory } from "../editor-api/editor-history.slice";
import { clearGitInfo } from "../git-api/git-api";
import { clearSearch } from "../search-api/search-api";

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
      // A previous project's search state (query, result ids) is relative to
      // the old folder — drop it now; switching projects goes through here
      // without closeProject, and this also invalidates in-flight searches.
      clearSearch();

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
        addErrorMessage(
          "Project does not specify project_name property in /project.yaml file.",
          "warning"
        );

      project.plugins = await window.project.getPlugins(selectedFolder);
      store.dispatch(setProject(project));

      // The Repo panel (always mounted) refreshes its own git state via a
      // useEffect on the project folder, so no explicit fetch is needed here.

      addOutputMessage(`Opening project: ${project.projectName}`);
    } else {
      store.dispatch(setLoading(false));
    }
  } catch (error) {
    addErrorMessage((error as Error).message, "error");
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
  const projectName = store.getState().projectAPI.projectName;
  store.dispatch(closeEditor());
  store.dispatch(closeProjectReducer());
  store.dispatch(clearActiveContext());
  store.dispatch(clearAllFormHistory());
  clearGitInfo();
  clearSearch();
  addOutputMessage(`Project closed: ${projectName}`);
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
    addErrorMessage((error as Error).message, "error");
    store.dispatch(closeProjectReducer());
  }
};
