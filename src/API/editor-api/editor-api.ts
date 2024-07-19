import { PayloadAction } from "@reduxjs/toolkit";
import { ProjectStructure } from "electron/src/project";
import {
  EditedFile,
  addEditedFile,
  removeEditedFile,
  setOpenFileId,
} from "./editor-api.slice";

export const openFile = (
  dispatch: (a: PayloadAction<EditedFile>) => void,
  data: ProjectStructure
) => {
  const editedFile: EditedFile = {
    id: data.id,
    name: data.name,
    content: "some content " + data.id,
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
