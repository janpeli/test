import { ipcMain, dialog } from "electron";
import fs from "node:fs";
import path from "node:path";

export type ProjectStructure = {
  id: string;
  isOpen: boolean;
  name: string;
  isFolder: boolean;
  children?: ProjectStructure[];
};

export async function readFileData(filePath: string): Promise<string> {
  const fileContent = await fs.promises.readFile(filePath, {
    encoding: "utf-8",
  });
  return fileContent;
}

export async function readProjectData(
  folderPath: string
): Promise<ProjectStructure> {
  const projectStructure: ProjectStructure = {
    id: folderPath,
    isOpen: true,
    name: path.basename(folderPath),
    isFolder: true,
    children: await readProjectDataRecurisive(folderPath),
  };
  return projectStructure;
}

async function readProjectDataRecurisive(
  folderPath: string
): Promise<ProjectStructure[]> {
  const entries = await fs.promises.readdir(folderPath, {
    withFileTypes: true,
  });

  const children: ProjectStructure[] = [];
  for (const entry of entries) {
    const currentPath = path.join(folderPath, entry.name);
    const child: ProjectStructure = {
      id: currentPath,
      isOpen: false,
      name: entry.name,
      isFolder: entry.isDirectory(),
      children: entry.isDirectory()
        ? await readProjectDataRecurisive(currentPath)
        : undefined,
    };
    children.push(child);
  }

  return children;
}

export default function setupIPCMain() {
  ipcMain.on("get-folder-contents", async (event, folderPath) => {
    try {
      const files = await fs.promises.readdir(folderPath);
      event.reply("folder-contents", files);
    } catch (error) {
      if (error instanceof Error) {
        event.reply("folder-contents-error", error.message);
      }
    }
  });

  ipcMain.on("open-folder-dialog", async (event) => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
      });
      if (!result.canceled && result.filePaths.length > 0) {
        event.reply("folder-selected", result.filePaths[0]);
      }
    } catch (error) {
      if (error instanceof Error) {
        event.reply("folder-selected-error", error.message);
      }
    }
  });

  ipcMain.on("get-project-contents", async (event, folderPath) => {
    try {
      const data = await readProjectData(folderPath);
      event.reply("project-contents", data);
    } catch (error) {
      if (error instanceof Error) {
        event.reply("project-contents-error", error.message);
      }
    }
  });

  ipcMain.on("get-file-contents", async (event, filePath) => {
    try {
      const data = await readFileData(filePath);
      event.reply("file-contents", data);
    } catch (error) {
      if (error instanceof Error) {
        event.reply("file-contents-error", error.message);
      }
    }
  });
}
