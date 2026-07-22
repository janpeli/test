import { Commands } from "..";
import {
  openCreateCanvasModal,
  openCreateFolderModal,
  openCreateMarkdownModal,
  openCreateSqlModal,
  openCreateModelModal,
  openCreateObjectModal,
  openDeleteModal,
  openRenameModal,
} from "../GUI-api/modal-api";
import { openFileById, openFileByIdInOtherView } from "./editor-api";

export function createNodeContextCommands(
  id: string,
  deleteIds: string[] = [id]
): Commands {
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
      displayName: "Object",
      description: "Create object",
      contextGroup: ["Create"],
      action: () => openCreateObjectModal(id),
    },
    {
      displayName: "Folder",
      description: "Create folder",
      contextGroup: ["Create"],
      action: () => openCreateFolderModal(id),
    },
    {
      displayName: "Model",
      description: "Create model",
      contextGroup: ["Create"],
      action: () => openCreateModelModal(id),
    },
    {
      displayName: "Markdown",
      description: "Create markdown file",
      contextGroup: ["Create"],
      action: () => openCreateMarkdownModal(id),
    },
    {
      displayName: "Canvas",
      description: "Create Mermaid canvas file",
      contextGroup: ["Create"],
      action: () => openCreateCanvasModal(id),
    },
    {
      displayName: "SQL",
      description: "Create SQL file",
      contextGroup: ["Create"],
      action: () => openCreateSqlModal(id),
    },
    {
      displayName: "Rename",
      description: "Rename this file",
      contextGroup: ["File"],
      action: () => openRenameModal(id),
    },
    {
      displayName: "Delete",
      description: "Delete this file",
      contextGroup: ["File"],
      action: () => openDeleteModal(deleteIds),
    },
  ];
  return comands;
}

export function createFolderContextCommands(
  id: string,
  deleteIds: string[] = [id]
): Commands {
  const comands: Commands = [
    {
      displayName: "Object",
      description: "Create object",
      contextGroup: ["Create"],
      action: () => openCreateObjectModal(id),
    },
    {
      displayName: "Folder",
      description: "Create folder",
      contextGroup: ["Create"],
      action: () => openCreateFolderModal(id),
    },
    {
      displayName: "Model",
      description: "Create model",
      contextGroup: ["Create"],
      action: () => openCreateModelModal(id),
    },
    {
      displayName: "Markdown",
      description: "Create markdown file",
      contextGroup: ["Create"],
      action: () => openCreateMarkdownModal(id),
    },
    {
      displayName: "Canvas",
      description: "Create Mermaid canvas file",
      contextGroup: ["Create"],
      action: () => openCreateCanvasModal(id),
    },
    {
      displayName: "SQL",
      description: "Create SQL file",
      contextGroup: ["Create"],
      action: () => openCreateSqlModal(id),
    },
    {
      displayName: "Rename",
      description: "Rename this folder",
      contextGroup: ["File"],
      action: () => openRenameModal(id),
    },
    {
      displayName: "Delete",
      description: "Delete this folder",
      contextGroup: ["File"],
      action: () => openDeleteModal(deleteIds),
    },
  ];
  return comands;
}
