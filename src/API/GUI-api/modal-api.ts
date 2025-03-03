import { store } from "@/app/store";
import { closeModal, openModal } from "./modal.slice";
import { getProjectStructurebyId } from "../project-api/project-api";
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
