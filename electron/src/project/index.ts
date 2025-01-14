import { ipcMain } from "electron";
import {
  openFolderDialog,
  readFileData,
  readFolderContents,
  readProjectData,
} from "./project";

export type ProjectStructure = {
  id: string;
  isOpen: boolean;
  name: string;
  isFolder: boolean;
  isLeaf: boolean;
  children?: ProjectStructure[];
};

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

  registerIPCHandler<string>(
    "get-file-contents",
    "file-contents",
    async (_, filePath) => readFileData(filePath)
  );
}
