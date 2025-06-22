import { Commands } from "..";
import {
  openCreateFolderModal,
  openCreateModelModal,
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
      contextGroup: ["Create"],
      action: () => openCreateObjectModal(id),
    },
    {
      displayName: "Create folder",
      description: "Create folder",
      contextGroup: ["Create"],
      action: () => openCreateFolderModal(id),
    },
    {
      displayName: "Create model",
      description: "Create model",
      contextGroup: ["Create"],
      action: () => openCreateModelModal(id),
    },
  ];
  return comands;
}

export function createFolderContextCommands(id: string): Commands {
  const comands: Commands = [
    {
      displayName: "Create object",
      description: "Create object",
      contextGroup: ["Create"],
      action: () => openCreateObjectModal(id),
    },
    {
      displayName: "Create folder",
      description: "Create folder",
      contextGroup: ["Create"],
      action: () => openCreateFolderModal(id),
    },
    {
      displayName: "Create model",
      description: "Create model",
      contextGroup: ["Create"],
      action: () => openCreateModelModal(id),
    },
  ];
  return comands;
}
