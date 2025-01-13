import { ProjectStructure } from "electron/src/project";
import { setProjectFolderPath, setProjectStructure } from "./project-api.slice";

import { store } from "@/app/store";

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
