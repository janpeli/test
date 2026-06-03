import { store } from "@/app/store";
import { closeModal, openModal } from "./modal.slice";
import {
  createCanvasFileInParent,
  createFolderInParent,
  createMarkdownFileInParent,
  createModelInParent,
  deleteProjectFile,
  deleteProjectFolder,
  getProjectStructurebyId,
  renameProjectNode,
} from "../project-api/project-api";
import { getFolderFromPath } from "../project-api/utils";
import { addErrorMessage } from "./status-panel-api";

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

export const openCreateModelModal = async (id: string) => {
  const projectStructure = getProjectStructurebyId(id);
  if (!projectStructure) return;
  if (projectStructure.plugin_uuid) {
    addErrorMessage("Cannot create a model inside another model.", "warning");
    return;
  }
  const path = projectStructure.isFolder
    ? projectStructure.id
    : getFolderFromPath(projectStructure.id);
  store.dispatch(openModal({ type: "create-model", id: path }));
};

export const openCreateMarkdownModal = async (id: string) => {
  const projectStructure = getProjectStructurebyId(id);
  if (!projectStructure) return;
  const path = projectStructure.isFolder
    ? projectStructure.id
    : getFolderFromPath(projectStructure.id);
  store.dispatch(openModal({ type: "create-markdown", id: path }));
};

export const createMarkdownFromModal = async (name: string) => {
  const { id } = store.getState().modalAPI;
  if (!id) return;
  createMarkdownFileInParent(name, id);
};

export const openCreateCanvasModal = async (id: string) => {
  const projectStructure = getProjectStructurebyId(id);
  if (!projectStructure) return;
  const path = projectStructure.isFolder
    ? projectStructure.id
    : getFolderFromPath(projectStructure.id);
  store.dispatch(openModal({ type: "create-canvas", id: path }));
};

export const createCanvasFromModal = async (name: string) => {
  const { id } = store.getState().modalAPI;
  if (!id) return;
  createCanvasFileInParent(name, id);
};

export const openAddPluginModal = async () => {
  store.dispatch(openModal({ type: "add-plugin", id: "" }));
};

export const createFolderFromModal = async (name: string) => {
  const { id } = store.getState().modalAPI;
  if (!id) return;
  createFolderInParent(name, id);
};

export const createModelFromModal = async (name: string, uuid: string) => {
  const { id } = store.getState().modalAPI;
  if (!id) return;
  createModelInParent(name, uuid, id);
};

export const openRenameModal = async (id: string) => {
  const projectStructure = getProjectStructurebyId(id);
  if (!projectStructure) return;
  if (projectStructure.sufix === "mdl") {
    addErrorMessage("Config files cannot be renamed.", "error");
    return;
  }
  if (id === "models") {
    addErrorMessage("The models folder cannot be renamed.", "error");
    return;
  }
  store.dispatch(openModal({ type: "rename", id }));
};

export const renameFromModal = async (newStem: string) => {
  const { id } = store.getState().modalAPI;
  if (!id) return;
  renameProjectNode(id, newStem);
};

export const openDeleteModal = async (id: string) => {
  const projectStructure = getProjectStructurebyId(id);
  if (!projectStructure) return;
  if (id === "models") {
    addErrorMessage("The models folder cannot be deleted.", "error");
    return;
  }
  store.dispatch(openModal({ type: "delete-confirm", id }));
};

export const deleteFromModal = async () => {
  const { id } = store.getState().modalAPI;
  if (!id) return;
  const node = getProjectStructurebyId(id);
  if (!node) return;
  if (node.isFolder) {
    await deleteProjectFolder(id);
  } else {
    await deleteProjectFile(id);
  }
};
