import {
  setProject,
  closeProject as closeProjectReducer,
  ProjectAPIState,
  setLoading,
} from "./project-api.slice";

import { store } from "@/app/store";
import { closeEditor } from "../editor-api/editor-api.slice";

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
