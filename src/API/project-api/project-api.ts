import {
  setProject,
  closeProject as closeProjectReducer,
  ProjectAPIState,
  setLoading,
} from "./project-api.slice";

import { store } from "@/app/store";
import { closeEditor } from "../editor-api/editor-api.slice";
import { ProjectStructure } from "electron/src/project";
import { findProjectStructureById } from "./utils";

export const openProject = async () => {
  //const dispatch = useAppDispatch();
  try {
    store.dispatch(setLoading(true));
    const selectedFolder = await window.project.openFolderDialog();

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
