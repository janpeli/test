import { store } from "@/app/store";
import { closeModal, openModal } from "./modal.slice";
import {
  createFolder,
  getProjectStructurebyId,
} from "../project-api/project-api";
import { getFolderFromPath, getPluginforFileID } from "../project-api/utils";
import { Plugin, ProjectStructure } from "electron/src/project";
import { addProjectStructure } from "../project-api/project-api.slice";
import { update_MAIN_SIDEBAR_EXPLORER_TREE } from "./main-sidebar-api";
import { addEditedFile } from "../editor-api/editor-api.slice";
import { updateFormData } from "../editor-api/editor-forms.slice";
import { IdefValues } from "@/features/Editor/utilities";
import { createEditedFile, saveEditedFile } from "../editor-api/editor-api";
import yaml from "yaml";

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
    children: [],
  };

  store.dispatch(
    addProjectStructure({
      path: id as string,
      projectStructure: folderProjectStructure,
    })
  );

  update_MAIN_SIDEBAR_EXPLORER_TREE();
};

export const createModelFromModal = async (name: string, uuid: string) => {
  const { id } = store.getState().modalAPI;

  // prepare folder
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
    children: [],
  };

  store.dispatch(
    addProjectStructure({
      path: id as string,
      projectStructure: folderProjectStructure,
    })
  );

  // prepare config.mdl.yaml
  const newId = `${id}\\${name}\\config.mdl.yaml`;
  const fileName = `config.mdl.yaml`;
  const data: IdefValues = { general: { Name: name, plugin_uuid: uuid } };
  const initialContent = yaml.stringify(data);
  const extension = "mdl";

  const editedFile = createEditedFile(
    newId,
    fileName,
    initialContent,
    uuid,
    extension
  );

  const fileProjectStructure: ProjectStructure = {
    id: newId,
    isOpen: false,
    name: fileName,
    isFolder: false,
    isLeaf: true,
    sufix: extension,
    plugin_uuid: uuid,
  };

  store.dispatch(
    addProjectStructure({
      path: folderProjectStructure.id,
      projectStructure: fileProjectStructure,
    })
  );
  store.dispatch(addEditedFile(editedFile));
  store.dispatch(updateFormData({ [newId]: data }));
  await saveEditedFile(newId);

  update_MAIN_SIDEBAR_EXPLORER_TREE();
};
