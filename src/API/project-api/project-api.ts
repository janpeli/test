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
import { findProjectStructureById } from "./utils";
import { update_MAIN_SIDEBAR_PLUGINS_TREE } from "../GUI-api/main-sidebar-api";

export const openProject = async (folder?: string) => {
  //const dispatch = useAppDispatch();
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

export const closeProject = async () => {
  store.dispatch(closeEditor());
  store.dispatch(closeProjectReducer());
};

// musim spravit to tak ze v modali vyberiem meno a path a potom az pustam toto....
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

export const getProjectStructureFiltered = (sufix: string[]) => {
  const projectStructure = store.getState().projectAPI
    .projectStructure as ProjectStructure;
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
};

export const getProjectStructurebyId = (id: string) => {
  const projectStructure = store.getState().projectAPI.projectStructure;
  if (projectStructure) return findProjectStructureById(projectStructure, id);
  return null;
};

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
  /// este updatnut sidebar
};

export const AddPlugin = async (uuid: string) => {
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
