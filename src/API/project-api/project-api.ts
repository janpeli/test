import {
  setProject,
  closeProject as closeProjectReducer,
  ProjectAPIState,
} from "./project-api.slice";

import { store } from "@/app/store";
import { closeEditor } from "../editor-api/editor-api.slice";

export const openProject = async () => {
  //const dispatch = useAppDispatch();
  try {
    const selectedFolder = await window.project.openFolderDialog();
    if (selectedFolder) {
      const project: ProjectAPIState = {
        projectName: null,
        projectStructure: null,
        folderPath: selectedFolder,
      };
      project.projectStructure = await window.project.getProjectStructure(
        selectedFolder
      );
      project.projectName = await window.project.getProjectName(selectedFolder);
      if (project.projectName === "")
        console.error(
          "Project does not specify project_name property in /project.yaml file."
        );
      store.dispatch(setProject(project));
    }
  } catch (error) {
    console.error("Error:", error);
    store.dispatch(closeProjectReducer());
  }
};

export const closeProject = async () => {
  store.dispatch(closeEditor());
  store.dispatch(closeProjectReducer());
};
