import { Commands } from "..";
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
  ];
  return comands;
}
