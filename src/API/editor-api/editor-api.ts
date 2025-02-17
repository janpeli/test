import { Plugin, ProjectStructure } from "electron/src/project";
import {
  EditedFile,
  addEditedFile,
  removeEditedFile,
  setOpenFileId,
  reorderEditedFile,
  reorderEditedFileThisLast,
  addEditedFileInOtherView,
  setEditorActive,
} from "./editor-api.slice";
import { store } from "@/app/store";
import * as monaco from "monaco-editor";
import { IdefValues } from "@/features/Editor/utilities";
import { removeForm, updateFormData } from "./editor-forms.slice";
import { FieldValues } from "react-hook-form";
import { getObjVal } from "./utils";
import {
  findProjectStructureById,
  getPluginforFileID,
  normalizeFilename,
} from "../project-api/utils";
import yaml from "yaml";
import { addProjectStructure } from "../project-api/project-api.slice";
import { MAIN_SIDEBAR_EXPLORER_TREE } from "../GUI-api/main-sidebar-api";

// ked sa otvori file tak spravit model

// Helpers

const createEditedFile = (
  id: string,
  name: string,
  content: string,
  plugin_uuid: string,
  sufix: string
): EditedFile => {
  console.log(`file:///${id}`);
  console.log(monaco.Uri.parse(`file:///${id}`));
  // Create the initial default model
  //const defaultModel = monaco.editor.createModel(
  // content,
  // "typescript", // default language
  //  monaco.Uri.parse(`file:///${id}`)
  //);

  // Initialize the models Map
  //const models = new Map<string, monaco.editor.ITextModel>();
  // models.set("YAML", defaultModel);

  return {
    id,
    name,
    content,
    plugin_uuid,
    sufix,
    //models,
  };
};

// API
export const openFile = async (data: ProjectStructure) => {
  const projectFolder = store.getState().projectAPI.folderPath as string;
  const content = await window.project.getFileContent({
    filePath: data.id,
    folderPath: projectFolder,
  });
  const { plugin_uuid, sufix } = findProjectStructureById(
    store.getState().projectAPI.projectStructure as ProjectStructure,
    data.id
  ) as ProjectStructure;
  const editedFile = createEditedFile(
    data.id,
    data.name,
    content,
    plugin_uuid as string,
    sufix
  );
  store.dispatch(addEditedFile(editedFile));
};

export const openFileById = async (id: string) => {
  // get folder path
  const projectFolder = store.getState().projectAPI.folderPath;
  if (!projectFolder) return;
  // get project structure
  const projectStructure = store.getState().projectAPI.projectStructure;
  if (!projectStructure) return;
  // get content
  const content = await window.project.getFileContent({
    filePath: id,
    folderPath: projectFolder,
  });
  // get file info from project structure
  const { plugin_uuid, sufix, name } = findProjectStructureById(
    projectStructure,
    id
  ) as ProjectStructure;
  const editedFile = createEditedFile(
    id,
    name,
    content,
    plugin_uuid as string,
    sufix
  );
  store.dispatch(addEditedFile(editedFile));
};

export const saveEditedFile = async (id: string) => {
  const projectFolder = store.getState().projectAPI.folderPath as string;

  if (!(id in store.getState().editorForms)) return false;
  const content = yaml.stringify(store.getState().editorForms[id]);

  return await window.project.saveFileContent({
    filePath: id,
    folderPath: projectFolder,
    content: content,
  });
};

export const openFileByIdInOtherView = async (id: string) => {
  const projectFolder = store.getState().projectAPI.folderPath;
  if (!projectFolder) return;
  const projectStructure = store.getState().projectAPI.projectStructure;
  if (!projectStructure) return;
  const content = await window.project.getFileContent({
    filePath: id,
    folderPath: projectFolder,
  });
  const { plugin_uuid, sufix, name } = findProjectStructureById(
    projectStructure,
    id
  ) as ProjectStructure;
  const editedFile: EditedFile = createEditedFile(
    id,
    name,
    content,
    plugin_uuid as string,
    sufix
  );
  store.dispatch(addEditedFileInOtherView(editedFile));
};

export const closeFile = (id: string) => {
  store.dispatch(removeEditedFile(id));
  store.dispatch(removeForm(id));
};

export const setActiveFile = (id: string) => {
  store.dispatch(setOpenFileId(id));
};

export const reorderFiles = (anchorID: string, movedID: string) => {
  store.dispatch(reorderEditedFile({ anchorID: anchorID, movedID: movedID }));
};

export const reorderFilesThisLast = (
  movedID: string,
  targetEditorIdx: number
) => {
  store.dispatch(
    reorderEditedFileThisLast({ editorId: targetEditorIdx, movedID: movedID })
  );
};

export const setActiveEditor = (editorIdx: number) => {
  if (store.getState().editorAPI.activeEditorIdx === editorIdx) return;
  store.dispatch(setEditorActive(editorIdx));
};

export const createEditorFormData = (formID: string, data: IdefValues) => {
  if (formID in store.getState().editorForms) return;
  store.dispatch(updateFormData({ [formID]: data }));
};

export const updateEditorFormData = (formID: string, data: IdefValues) => {
  store.dispatch(updateFormData({ [formID]: data }));
};

export const updateEditorFormDatabyPath = (
  formID: string,
  data: FieldValues,
  path: string
) => {
  console.log(store.getState().editorForms);
  console.log(formID);
  if (!(formID in store.getState().editorForms)) return;
  const oldData = store.getState().editorForms[formID];

  const oldValue = getObjVal(oldData, path);
  const newValue = getObjVal(data, path);

  console.log(`oldValue: ${oldValue} newValue: ${newValue}`);

  if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
    return; // Values are the same, no need to dispatch
  }

  store.dispatch(updateFormData({ [formID]: data }));
};

export const getFormState = (formId: string) => {
  const state = store.getState().editorForms;
  if (formId in state) return state[formId];
  return undefined;
};

export const createFileFromModal = () => {
  const { id } = store.getState().modalAPI;
  const { file_name, base_object_type, template } =
    store.getState().editorForms["create-object"];
  const normalizedFileName = normalizeFilename(file_name as string, {
    replacement: "_",
  });
  const projectStructure = store.getState().projectAPI.projectStructure;
  const plugin = getPluginforFileID(
    id as string,
    projectStructure as ProjectStructure,
    store.getState().projectAPI.plugins as Plugin[]
  );
  const extension =
    plugin && base_object_type
      ? (plugin.base_objects.find((obj) => obj.name === base_object_type)
          ?.sufix as string)
      : "";
  const newId = `${id}\\${normalizedFileName}${
    extension ? "." + extension : ""
  }.yaml`;
  const name = `${normalizedFileName}${extension ? "." + extension : ""}`;
  const data: IdefValues = { general: { name: file_name, template: template } };
  const initialContent = yaml.stringify(data);
  const uuid = plugin?.uuid as string;

  const editedFile = createEditedFile(
    newId,
    name,
    initialContent,
    uuid,
    extension
  );

  const fileProjectStructure: ProjectStructure = {
    id: newId,
    isOpen: false,
    name,
    isFolder: false,
    isLeaf: true,
    sufix: extension,
    plugin_uuid: uuid,
  };

  store.dispatch(
    addProjectStructure({
      path: id as string,
      projectStructure: fileProjectStructure,
    })
  );
  store.dispatch(addEditedFile(editedFile));
  store.dispatch(updateFormData({ [newId]: data }));
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
