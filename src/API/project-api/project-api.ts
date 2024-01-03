import { ProjectStructure } from "electron/src/project";
import { setProjectFolderPath, setProjectStructure } from "./project-api.slice";

export const openProject = async (dispatch) => {
  try {
    const selectedFolder = await window.project.openFolderDialog();
    if (selectedFolder) {
      dispatch(setProjectFolderPath(selectedFolder));
      const projectStructure: ProjectStructure =
        await window.project.getProjectStructure(selectedFolder);
      dispatch(setProjectStructure(projectStructure));
    }
  } catch (error) {
    console.error("Error:", error);
  }
};
