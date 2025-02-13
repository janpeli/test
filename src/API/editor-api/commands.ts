import { Commands } from "..";
import { openModals } from "../GUI-api/modal-api";
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
      displayName: "Open Modal",
      description: "test",
      contextGroup: ["File"],
      action: () => openModals("something something", "content"),
    },
  ];
  return comands;
}
