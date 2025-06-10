import { ipcMain } from "electron";
import {
  createFolder,
  openFolderDialog,
  readFileData,
  readFolderContents,
  readProjectData,
  readProjectName,
  saveFileContent,
} from "./project";
import { createNewProject } from "./createProject";
import { getPlugins } from "./plugins";
import scanPlugins, { copyPluginData } from "./plugin-definitions";

export type ProjectStructure = {
  id: string;
  isOpen: boolean;
  name: string;
  isFolder: boolean;
  isLeaf: boolean;
  children?: ProjectStructure[];
  sufix: string;
  plugin_uuid: string | null;
};

interface BaseObject {
  name: string;
  definition: string;
  template: string;
  archetype: "entity" | "relation";
  sufix: string;
}

export interface Plugin {
  target_db: string | null;
  parser: string | null;
  base_objects: BaseObject[];
  model_schema: string;
  uuid: string;
  name: string;
}

export type SaveFileProps = {
  filePath: string;
  folderPath: string;
  content: string;
};

export type CreateProjectProps = { folderPath: string; projectName: string };

export type CreateFolderProps = {
  projectPath: string;
  relativeFolderPath: string;
};

export type CopyPluginProps = { destinationFolderPath: string; uuid: string };

// Utility to register IPC handlers
function registerIPCHandler<T>(
  channel: string,
  replyChanel: string,
  handler: (event: Electron.IpcMainEvent, arg: T) => Promise<unknown>
) {
  ipcMain.on(channel, async (event, arg: T) => {
    try {
      const result = await handler(event, arg);
      event.reply(replyChanel, result);
    } catch (error) {
      if (error instanceof Error) {
        event.reply(`${replyChanel}-error`, error.message);
      } else {
        event.reply(`${replyChanel}-error`, "An unknown error occurred.");
      }
    }
  });
}

// Setup IPC handlers
export default function setupIPCMain() {
  registerIPCHandler<string>(
    "get-folder-contents",
    "folder-contents",
    async (_, folderPath) => readFolderContents(folderPath)
  );

  registerIPCHandler<void>("open-folder-dialog", "folder-selected", async () =>
    openFolderDialog()
  );

  registerIPCHandler<string>(
    "get-project-contents",
    "project-contents",
    async (_, folderPath) => readProjectData(folderPath)
  );

  registerIPCHandler<{ filePath: string; folderPath: string }>(
    "get-file-contents",
    "file-contents",
    async (_, { filePath, folderPath }) =>
      readFileData({ filePath, folderPath })
  );

  registerIPCHandler<string>(
    "get-project-name",
    "project-name",
    async (_, filePath) => readProjectName(filePath)
  );

  registerIPCHandler<string>(
    "get-plugins-contents",
    "plugins-contents",
    async (_, folderPath) => getPlugins(folderPath)
  );

  registerIPCHandler<SaveFileProps>(
    "save-file-contents",
    "save-file-status",
    async (_, props) => saveFileContent(props)
  );

  registerIPCHandler<CreateProjectProps>(
    "create-project",
    "create-project-status",
    async (_, props) => createNewProject(props.folderPath, props.projectName)
  );
  //create-project

  registerIPCHandler<CreateFolderProps>(
    "create-folder",
    "create-folder-status",
    async (_, props) =>
      createFolder(props.projectPath, props.relativeFolderPath)
  );

  registerIPCHandler<void>(
    "get-list-of-plugins",
    "get-list-of-plugins-status",
    async () => scanPlugins()
  );

  registerIPCHandler<CopyPluginProps>(
    "copy-plugin-data",
    "copy-plugin-data-status",
    async (_, props) => copyPluginData(props.destinationFolderPath, props.uuid)
  );
}
