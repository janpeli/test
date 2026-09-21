import { Commands } from "..";
import {
  openCreateCanvasModal,
  openCreateDrawioModal,
  openCreateFolderModal,
  openCreateMarkdownModal,
  openCreateSqlModal,
  openCreateModelModal,
  openCreateObjectModal,
  openDeleteModal,
  openRenameModal,
} from "../GUI-api/modal-api";
import { openFileById, openFileByIdInOtherView } from "./editor-api";
import { store } from "@/app/store";
import { selectProjectPath } from "../project-api/project-api.selectors";
import { toAbsolutePath } from "@/features/Editor/tab-area/tab-context.core";

/**
 * "Copy Path"/"Copy Relative Path" for a tree node. Relative path is omitted
 * for the synthetic root (empty id) since it has no relative path of its own;
 * absolute path still resolves there to the project folder itself.
 */
export function createCopyPathCommands(id: string): Commands {
  const folderPath = selectProjectPath(store.getState());
  const commands: Commands = [];
  if (folderPath) {
    commands.push({
      displayName: "Copy Path",
      description: "Copy absolute file path",
      contextGroup: ["File"],
      action: async () =>
        navigator.clipboard.writeText(toAbsolutePath(folderPath, id)),
    });
  }
  if (id) {
    commands.push({
      displayName: "Copy Relative Path",
      description: "Copy project-relative file path",
      contextGroup: ["File"],
      action: async () => navigator.clipboard.writeText(id),
    });
  }
  return commands;
}

/**
 * Context menu for the Explorer's synthetic project-root container. Only what
 * makes sense at the top level: new model folders and models. File commands are
 * deliberately absent — a loose object or markdown file at the project root
 * would sit outside every model folder.
 */
export function createRootContextCommands(id: string): Commands {
  return [
    ...createCopyPathCommands(id),
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
  ];
}

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
    ...createCopyPathCommands(id),
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
      displayName: "Drawio diagram",
      description: "Create drawio diagram file",
      contextGroup: ["Create"],
      action: () => openCreateDrawioModal(id),
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
    ...createCopyPathCommands(id),
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
      displayName: "Drawio diagram",
      description: "Create drawio diagram file",
      contextGroup: ["Create"],
      action: () => openCreateDrawioModal(id),
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
