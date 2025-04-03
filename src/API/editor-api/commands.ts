import { Commands } from "..";
import {
  openCreateFolderModal,
  openCreateObjectModal,
} from "../GUI-api/modal-api";
import { openFileById, openFileByIdInOtherView } from "./editor-api";

export function createNodeContextCommands(id: string): Commands {
  const comands: Commands = [
    {
      displayName: "Open",
      description: "Open file in editor",
      contextGroup: ["File"],
      action: () => openFileById(id),
    },
    {
      displayName: "Open In Other View",
      description: "Open file in editor",
      contextGroup: ["File"],
      action: () => openFileByIdInOtherView(id),
    },
    {
      displayName: "Create object",
      description: "Create object",
      contextGroup: ["File"],
      action: () => openCreateObjectModal(id),
    },
    {
      displayName: "Create folder",
      description: "Create folder",
      contextGroup: ["File"],
      action: () => openCreateFolderModal(id),
    },
  ];
  return comands;
}

export function createFolderContextCommands(id: string): Commands {
  const comands: Commands = [
    {
      displayName: "Create object",
      description: "Create object",
      contextGroup: ["File"],
      action: () => openCreateObjectModal(id),
    },
    {
      displayName: "Create folder",
      description: "Create folder",
      contextGroup: ["File"],
      action: () => openCreateFolderModal(id),
    },
  ];
  return comands;
}
