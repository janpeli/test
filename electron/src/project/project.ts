import { dialog } from "electron";
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

import { ProjectStructure, SaveFileProps } from "./index.ts";
import { FileWriter } from "../file-writer";

/**
 * Reads the contents of a folder and returns an array of file/folder names
 * @param folderPath - The path to the folder to read
 * @returns Promise resolving to an array of file and folder names
 */
export async function readFolderContents(
  folderPath: string
): Promise<string[]> {
  const files = await fs.promises.readdir(folderPath);
  return files;
}

/**
 * Reads the content of a specific file using FileWriter
 * @param props - Object containing filePath and folderPath
 * @param props.filePath - The path to the file to read
 * @param props.folderPath - The base folder path
 * @returns Promise resolving to the file content as a string
 */
export async function readFileData(props: {
  filePath: string;
  folderPath: string;
}): Promise<string> {
  const fileWriter = new FileWriter(props.folderPath);
  const fileContent = await fileWriter.readTextFile(props.filePath);
  return fileContent;
}

/**
 * Reads the project name from a project.yaml file in the specified folder
 * @param folderPath - The path to the folder containing project.yaml
 * @returns Promise resolving to the project name or empty string if not found
 */
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

/**
 * Opens a folder selection dialog and returns the selected folder path
 * @returns Promise resolving to the selected folder path or empty string if canceled
 */
export async function openFolderDialog(): Promise<string> {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return "";
}

/**
 * Reads and builds the complete project structure recursively
 * @param folderPath - The root folder path of the project
 * @returns Promise resolving to the complete ProjectStructure object
 */
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
        (file) => file.sufix.toLocaleLowerCase().normalize().trim() === "mdl"
      );
      console.log(model_definition);
      if (model_definition) {
        projectStructure.plugin_uuid = model_definition.plugin_uuid;
        projectStructure.isModel = true;
        console.log("running");
      }
    }
  });
  return projectStructure;
}

/**
 * Traverses a project structure tree and executes a callback function on each node
 * @param node - The current ProjectStructure node to process
 * @param callback - Function to execute on each node during traversal
 */
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

/**
 * Finds and extracts the plugin_uuid from a file content using regex
 * @param filePath - The path to the file to search in
 * @returns The plugin UUID string or empty string if not found
 */
function findPluginUuidWholeFile(filePath: string): string | "" {
  const content = fs.readFileSync(filePath, "utf8");
  const expresion = new RegExp("plugin_uuid:\\s*(.*)", "m");
  const match = content.match(expresion);
  return match ? match[1].trim() : "";
}

/**
 * Recursively reads project data and builds the project structure tree
 * @param folderPath - The current folder path being processed
 * @param rootPath - The root path of the project (used for relative path calculation)
 * @param plugin_uuid - The plugin UUID to inherit for child nodes (optional)
 * @returns Promise resolving to an array of ProjectStructure objects representing the folder contents
 */
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
      if (sufix.toLocaleLowerCase() === "mdl") {
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

    const fileExtension = !entry.isDirectory()
      ? splitName[splitName.length - 1]
      : "";
    let sufix = "";
    if (
      fileExtension &&
      splitName.length > 2 &&
      ["yaml", "yml"].includes(fileExtension.toLocaleLowerCase())
    ) {
      sufix = splitName[splitName.length - 2];
    } else {
      sufix = fileExtension;
    }

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
      isModel: false,
    };
    children.push(child);
  }

  return children;
}

/**
 * Saves content to a file using the FileWriter utility
 * @param props - Object containing save file properties
 * @param props.folderPath - The base folder path
 * @param props.filePath - The relative path to the file to save
 * @param props.content - The content to write to the file
 * @returns Promise resolving to true if successful
 */
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
