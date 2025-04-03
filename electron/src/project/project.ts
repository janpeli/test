import { dialog } from "electron";
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

import { ProjectStructure, SaveFileProps } from "./index.ts";
import { FileWriter } from "../file-writer";

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
  const fileWriter = new FileWriter(props.folderPath);
  const fileContent = await fileWriter.readTextFile(props.filePath);
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
    sufix: "",
    plugin_uuid: "",
  };
  traverseProjectStructure(projectStructure, (projectStructure) => {
    if (projectStructure.children && !projectStructure.plugin_uuid) {
      const model_definition = projectStructure.children.find(
        (file) => file.sufix === "mdl"
      );
      if (model_definition)
        projectStructure.plugin_uuid = model_definition.plugin_uuid;
    }
  });
  return projectStructure;
}

export function traverseProjectStructure(
  node: ProjectStructure,
  callback: (node: ProjectStructure) => void
) {
  // Process current node
  callback(node);

  // Process children
  if (node.children) {
    node.children.forEach((child) => traverseProjectStructure(child, callback));
  }
}

function findPluginUuidWholeFile(filePath: string): string | "" {
  const content = fs.readFileSync(filePath, "utf8");
  const expresion = new RegExp("plugin_uuid:\\s*(.*)", "m");
  const match = content.match(expresion);
  return match ? match[1].trim() : "";
}

async function readProjectDataRecurisive(
  folderPath: string,
  rootPath: string,
  plugin_uuid: string = ""
): Promise<ProjectStructure[]> {
  const entries = await fs.promises.readdir(folderPath, {
    withFileTypes: true,
  });

  // if there is a model we read a model uuid to know which plug in we are using for that file
  let current_uuid = plugin_uuid;
  if (current_uuid === "") {
    for (const entry of entries) {
      const splitName = entry.name.split(".");
      const sufix =
        !entry.isDirectory() && splitName.length > 2
          ? splitName[splitName.length - 2]
          : "";
      if (sufix === "mdl") {
        current_uuid = findPluginUuidWholeFile(
          path.join(folderPath, entry.name)
        );
      }
    }
  }

  const children: ProjectStructure[] = [];
  for (const entry of entries) {
    const currentPath = path.join(folderPath, entry.name);
    // Calculate relative path by removing the rootPath from the currentPath
    const relativePath = path.relative(rootPath, currentPath);
    const splitName = entry.name.split(".");
    const lastDotIndex = entry.name.lastIndexOf(".");
    const name =
      lastDotIndex > -1 ? entry.name.slice(0, lastDotIndex) : entry.name;
    const sufix =
      !entry.isDirectory() && splitName.length > 2
        ? splitName[splitName.length - 2]
        : "";

    const child: ProjectStructure = {
      id: relativePath, // Now using relative path instead of full path
      isOpen: false,
      name: name,
      isFolder: entry.isDirectory(),
      isLeaf: !entry.isDirectory(),
      children: entry.isDirectory()
        ? await readProjectDataRecurisive(currentPath, rootPath, current_uuid)
        : undefined,
      sufix: sufix,
      plugin_uuid: current_uuid,
    };
    children.push(child);
  }

  return children;
}

export async function saveFileContent(props: SaveFileProps) {
  const fileWriter = new FileWriter(props.folderPath);
  const result = await fileWriter.writeFile(props.filePath, props.content, {
    encoding: "utf-8",
  });
  console.log("File writen in path:", result.path);
  return true;
}

/**
 * Creates a new folder within a project
 * @param projectPath - Base project path
 * @param relativeFolderPath - Path relative to the project base where folder should be created
 * @returns Promise resolving to the full path of the created folder or empty string if failed
 */
export async function createFolder(
  projectPath: string,
  relativeFolderPath: string
): Promise<string> {
  try {
    const fileWriter = new FileWriter(projectPath);
    const fullPath = await fileWriter.createFolder(relativeFolderPath);
    console.log("Folder created at:", fullPath);
    return fullPath;
  } catch (error) {
    console.error("Failed to create folder:", error);
    return "";
  }
}
