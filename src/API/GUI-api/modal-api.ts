import { store } from "@/app/store";
import { closeModal, openModal } from "./modal.slice";
import {
  createFolder,
  getProjectStructurebyId,
} from "../project-api/project-api";
import { getFolderFromPath, getPluginforFileID } from "../project-api/utils";
import { Plugin, ProjectStructure } from "electron/src/project";
import { addProjectStructure } from "../project-api/project-api.slice";
import { MAIN_SIDEBAR_EXPLORER_TREE } from "./main-sidebar-api";

export const closeModals = () => store.dispatch(closeModal());

export const openModals = async (type: string, id: string) => {
  const projectStructure = getProjectStructurebyId(id);
  if (!projectStructure) return [];
  store.dispatch(openModal({ type, id }));
};

export const openCreateObjectModal = async (id: string) => {
  const projectStructure = getProjectStructurebyId(id);
  if (!projectStructure) return;
  const path = projectStructure.isFolder
    ? projectStructure.id
    : getFolderFromPath(projectStructure.id);
  store.dispatch(openModal({ type: "create-object", id: path }));
};

export const openCreateProjectModal = async () => {
  store.dispatch(openModal({ type: "create-project", id: "" }));
};

export const openCreateFolderModal = async (id: string) => {
  const projectStructure = getProjectStructurebyId(id);
  if (!projectStructure) return;
  const path = projectStructure.isFolder
    ? projectStructure.id
    : getFolderFromPath(projectStructure.id);
  store.dispatch(openModal({ type: "create-folder", id: path }));
};

export const createFolderFromModal = async (name: string) => {
  const { id } = store.getState().modalAPI;

  const projectStructure = store.getState().projectAPI.projectStructure;
  const plugin = getPluginforFileID(
    id as string,
    projectStructure as ProjectStructure,
    store.getState().projectAPI.plugins as Plugin[]
  );

  const uuid = plugin?.uuid as string;

  const newRelativePath = id + "\\" + name;
  await createFolder(newRelativePath);

  const folderProjectStructure: ProjectStructure = {
    id: newRelativePath,
    isOpen: true,
    name,
    isFolder: true,
    isLeaf: false,
    sufix: "",
    plugin_uuid: uuid,
  };

  store.dispatch(
    addProjectStructure({
      path: id as string,
      projectStructure: folderProjectStructure,
    })
  );

  const newProjectStructure = store.getState().projectAPI.projectStructure;

  if (
    MAIN_SIDEBAR_EXPLORER_TREE.tree &&
    newProjectStructure &&
    newProjectStructure.children
  ) {
    MAIN_SIDEBAR_EXPLORER_TREE.tree.updateTreeData(
      newProjectStructure.children.find(
        (child) => child.name === "models"
      ) as ProjectStructure
    );
    console.log(MAIN_SIDEBAR_EXPLORER_TREE);
  }
};
