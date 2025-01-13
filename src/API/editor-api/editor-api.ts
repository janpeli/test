import { ProjectStructure } from "electron/src/project";
import {
  EditedFile,
  addEditedFile,
  removeEditedFile,
  setOpenFileId,
  reorderEditedFile,
  reorderEditedFileThisLast,
} from "./editor-api.slice";
import { store } from "@/app/store";

export const openFile = async (data: ProjectStructure) => {
  const content = await window.project.getFileContent(data.id);
  const editedFile: EditedFile = {
    id: data.id,
    name: data.name,
    content: content,
  };
  store.dispatch(addEditedFile(editedFile));
};

export const openFileById = async (id: string, name: string) => {
  const content = await window.project.getFileContent(id);
  const editedFile: EditedFile = {
    id: id,
    name: name,
    content: content,
  };
  store.dispatch(addEditedFile(editedFile));
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

export const reorderFilesThisLast = (movedID: string) => {
  store.dispatch(reorderEditedFileThisLast(movedID));
};
