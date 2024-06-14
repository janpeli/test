import { ipcMain, dialog } from "electron";
import fs from "node:fs";
import path from "node:path";

export type ProjectStructure = {
  id: string;
  isOpen: boolean;
  name: string;
  children?: ProjectStructure[];
};

export async function readProjectData(
  folderPath: string
): Promise<ProjectStructure> {
  const projectStructure: ProjectStructure = {
    id: folderPath,
    isOpen: true,
    name: path.basename(folderPath),
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

  let children: ProjectStructure[] = [];
  for (const entry of entries) {
    const currentPath = path.join(folderPath, entry.name);
    const child: ProjectStructure = {
      id: currentPath,
      isOpen: false,
      name: entry.name,
      children: entry.isDirectory()
        ? await readProjectDataRecurisive(currentPath)
        : undefined,
    };
    children.push(child);
  }

  return children;
}

async function readDirectoryRecursive(folderPath: string): Promise<string[]> {
  let files: string[] = [];

  const entries = await fs.promises.readdir(folderPath, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      const subDirectoryFiles = await readDirectoryRecursive(entryPath);
      files = files.concat(subDirectoryFiles);
    } else {
      files.push(entryPath);
    }
  }

  return files;
}

export default function setupIPCMain() {
  ipcMain.on("get-folder-contents", async (event, folderPath) => {
    try {
      const files = await fs.promises.readdir(folderPath);
      event.reply("folder-contents", files);
    } catch (error: any) {
      event.reply("folder-contents-error", error.message);
    }
  });

  ipcMain.on("open-folder-dialog", async (event) => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      event.reply("folder-selected", result.filePaths[0]);
    }
  });

  ipcMain.on("get-project-contents", async (event, folderPath) => {
    try {
      const data = await readProjectData(folderPath);
      event.reply("project-contents", data);
    } catch (error: any) {
      event.reply("project-contents-error", error.message);
    }
  });
}
