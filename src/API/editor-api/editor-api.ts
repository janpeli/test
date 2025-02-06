import { ProjectStructure } from "electron/src/project";
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
import { findProjectStructureById } from "../project-api/project-api.slice";

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

export const openFileById = async (id: string, name: string) => {
  const projectFolder = store.getState().projectAPI.folderPath as string;
  const content = await window.project.getFileContent({
    filePath: id,
    folderPath: projectFolder,
  });
  const { plugin_uuid, sufix } = findProjectStructureById(
    store.getState().projectAPI.projectStructure as ProjectStructure,
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

export const openFileByIdInOtherView = async (id: string, name: string) => {
  const projectFolder = store.getState().projectAPI.folderPath as string;
  const content = await window.project.getFileContent({
    filePath: id,
    folderPath: projectFolder,
  });
  const { plugin_uuid, sufix } = findProjectStructureById(
    store.getState().projectAPI.projectStructure as ProjectStructure,
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
