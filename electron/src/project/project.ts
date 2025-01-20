import { dialog } from "electron";
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

import { ProjectStructure } from "./index.ts";

export async function readFolderContents(
  folderPath: string
): Promise<string[]> {
  const files = await fs.promises.readdir(folderPath);
  return files;
}

export async function readFileData(props: {
  filePath: string;
  folderPath: string;
}): Promise<string> {
  const fileContent = await fs.promises.readFile(
    path.join(props.folderPath, props.filePath),
    {
      encoding: "utf-8",
    }
  );
  return fileContent;
}

export async function readProjectName(folderPath: string): Promise<string> {
  const project_path = path.join(folderPath, "project.yaml");
  const fileContent = await fs.promises.readFile(project_path, {
    encoding: "utf-8",
  });
  const y = yaml.parse(fileContent);
  if (Object.keys(y).includes("project_name")) {
    const result = y["project_name"];
    if (typeof result === "string") return result;
  }
  return "";
}

export async function openFolderDialog(): Promise<string> {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return "";
}

export async function readProjectData(
  folderPath: string
): Promise<ProjectStructure> {
  const projectStructure: ProjectStructure = {
    id: folderPath,
    isOpen: true,
    name: path.basename(folderPath),
    isFolder: true,
    isLeaf: false,
    children: await readProjectDataRecurisive(folderPath, folderPath),
  };
  return projectStructure;
}

/*
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
      isLeaf: !entry.isDirectory(),
      children: entry.isDirectory()
        ? await readProjectDataRecurisive(currentPath)
        : undefined,
    };
    children.push(child);
  }

  return children;
}
  */

async function readProjectDataRecurisive(
  folderPath: string,
  rootPath: string
): Promise<ProjectStructure[]> {
  const entries = await fs.promises.readdir(folderPath, {
    withFileTypes: true,
  });
  const children: ProjectStructure[] = [];

  for (const entry of entries) {
    const currentPath = path.join(folderPath, entry.name);
    // Calculate relative path by removing the rootPath from the currentPath
    const relativePath = path.relative(rootPath, currentPath);

    const child: ProjectStructure = {
      id: relativePath, // Now using relative path instead of full path
      isOpen: false,
      name: entry.name,
      isFolder: entry.isDirectory(),
      isLeaf: !entry.isDirectory(),
      children: entry.isDirectory()
        ? await readProjectDataRecurisive(currentPath, rootPath)
        : undefined,
    };
    children.push(child);
  }
  return children;
}
