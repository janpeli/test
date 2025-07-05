import { store } from "@/app/store";
import { closeModal, openModal } from "./modal.slice";
import {
  createFolderInParent,
  createModelInParent,
  getProjectStructurebyId,
} from "../project-api/project-api";
import { getFolderFromPath } from "../project-api/utils";

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
  console.log({ projectStructure });
  if (!projectStructure) return;
  const path = projectStructure.isFolder
    ? projectStructure.id
    : getFolderFromPath(projectStructure.id);
  store.dispatch(openModal({ type: "create-folder", id: path }));
};

export const openCreateModelModal = async (id: string) => {
  const projectStructure = getProjectStructurebyId(id);
  //console.log({ projectStructure });
  if (!projectStructure || projectStructure.plugin_uuid) return;
  const path = projectStructure.isFolder
    ? projectStructure.id
    : getFolderFromPath(projectStructure.id);
  store.dispatch(openModal({ type: "create-model", id: path }));
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
