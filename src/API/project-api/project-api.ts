import { ProjectStructure } from "electron/src/project";
import {
  setProjectFolderPath,
  setProjectStructure,
  closeProject as closeProjectReducer,
} from "./project-api.slice";

import { store } from "@/app/store";
import { closeEditor } from "../editor-api/editor-api.slice";

export const openProject = async () => {
  //const dispatch = useAppDispatch();
  try {
    const selectedFolder = await window.project.openFolderDialog();
    if (selectedFolder) {
      store.dispatch(setProjectFolderPath(selectedFolder));
      const projectStructure: ProjectStructure =
        await window.project.getProjectStructure(selectedFolder);
      store.dispatch(setProjectStructure(projectStructure));
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

export const closeProject = async () => {
  store.dispatch(closeEditor());
  store.dispatch(closeProjectReducer());
};
