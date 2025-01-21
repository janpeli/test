import { dialog } from "electron";
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

import { ProjectStructure, Plugin } from "./index.ts";

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

export async function loadPlugin(folderPath: string): Promise<Plugin> {
  try {
    // Read the YAML file
    const fileContents = await fs.promises.readFile(folderPath, "utf8");

    // Parse YAML to JavaScript object
    const plugin = yaml.parse(fileContents) as Plugin;

    for (const baseObject of plugin.base_objects) {
      try {
        const definition = await fs.promises.readFile(
          path.relative(folderPath, baseObject.definition),
          "utf8"
        );

        baseObject.definition = definition;
      } catch (error) {
        console.warn(
          `No definition found in ${baseObject.definition} or unable to access it`
        );
        baseObject.definition = "";
      }

      try {
        const template = await fs.promises.readFile(
          path.relative(folderPath, baseObject.template),
          "utf8"
        );

        baseObject.template = template;
      } catch (error) {
        console.warn(
          `No template found in ${baseObject.template} or unable to access it`
        );
        baseObject.template = "";
      }
    }

    try {
      const model_schema = await fs.promises.readFile(
        path.relative(folderPath, plugin.model_schema),
        "utf8"
      );

      plugin.model_schema = model_schema;
    } catch (error) {
      console.warn(
        `No model schema found in ${plugin.model_schema} or unable to access it`
      );
      plugin.model_schema = "";
    }

    return plugin;
  } catch (error) {
    throw new Error(`Error loading config: ${error}`);
  }
}

export async function loadAllPluginConfigs(
  folderPath: string
): Promise<Plugin[]> {
  const configsArray: Plugin[] = [];
  const pluginPath = path.join(folderPath, "plugins");
  try {
    // Get all directories in the models folder
    const modelDirs = await fs.promises.readdir(pluginPath, {
      withFileTypes: true,
    });

    // Process each directory
    for (const dir of modelDirs) {
      if (dir.isDirectory()) {
        const configPath = path.join(pluginPath, dir.name, "config.yaml");

        // Check if config.yaml exists in this directory
        try {
          await fs.promises.access(configPath);
          const config = await loadPlugin(configPath);
          configsArray.push(config);
        } catch (error) {
          console.warn(
            `No config.yaml found in ${dir.name} or unable to access it`
          );
        }
      }
    }

    return configsArray;
  } catch (error) {
    throw new Error(`Error loading model configs: ${error}`);
  }
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
  return projectStructure;
}

function findPluginUuidWholeFile(filePath: string): string | "" {
  const content = fs.readFileSync(filePath, "utf8");
  const expresion = new RegExp("^plugin_uuid:\\s*(.*)", "m");
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
