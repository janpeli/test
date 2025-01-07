import { PayloadAction } from "@reduxjs/toolkit";
import { ProjectStructure } from "electron/src/project";
import {
  EditedFile,
  addEditedFile,
  removeEditedFile,
  setOpenFileId,
  reorderEditedFile,
  Reorder,
  reorderEditedFileThisLast,
} from "./editor-api.slice";

export const openFile = async (
  dispatch: (a: PayloadAction<EditedFile>) => void,
  data: ProjectStructure
) => {
  const content = await window.project.getFileContent(data.id);
  const editedFile: EditedFile = {
    id: data.id,
    name: data.name,
    content: content,
  };
  dispatch(addEditedFile(editedFile));
};

export const openFileById = async (
  dispatch: (a: PayloadAction<EditedFile>) => void,
  id: string,
  name: string
) => {
  const content = await window.project.getFileContent(id);
  const editedFile: EditedFile = {
    id: id,
    name: name,
    content: content,
  };
  dispatch(addEditedFile(editedFile));
};

export const closeFile = (
  dispatch: (a: PayloadAction<string>) => void,
  id: string
) => {
  dispatch(removeEditedFile(id));
};

export const setActiveFile = (
  dispatch: (a: PayloadAction<string>) => void,
  id: string
) => {
  dispatch(setOpenFileId(id));
};

export const reorderFiles = (
  dispatch: (a: PayloadAction<Reorder>) => void,
  anchorID: string,
  movedID: string
) => {
  dispatch(reorderEditedFile({ anchorID: anchorID, movedID: movedID }));
};

export const reorderFilesThisLast = (
  dispatch: (a: PayloadAction<string>) => void,
  movedID: string
) => {
  dispatch(reorderEditedFileThisLast(movedID));
};
