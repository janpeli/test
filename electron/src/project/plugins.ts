import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { FileWriter } from "../file-writer";
import { Plugin } from "./index.ts";

/**
 * Loads a plugin configuration from a YAML file and resolves all file references
 * @param configPath - The path to the plugin's config.yaml file
 * @returns Promise resolving to a fully loaded Plugin object with all file contents resolved
 * @throws Error if the config file cannot be loaded or parsed
 */
export async function loadPlugin(configPath: string): Promise<Plugin> {
  try {
    const fileWriter = new FileWriter(path.dirname(configPath));
    // Read the YAML file
    const fileContents = await fileWriter.readTextFile(configPath);
    // Parse YAML to JavaScript object
    const plugin = yaml.parse(fileContents) as Plugin;

    // Load definition and template files for each base object
    for (const baseObject of plugin.base_objects) {
      try {
        const definition = await fileWriter.readTextFile(baseObject.definition);
        baseObject.definition = definition;
      } catch (error) {
        console.warn(
          `No definition found in ${baseObject.definition} or unable to access it`
        );
        baseObject.definition = "";
      }
      try {
        const template = await fileWriter.readTextFile(baseObject.template);
        baseObject.template = template;
      } catch (error) {
        console.warn(
          `No template found in ${baseObject.template} or unable to access it`
        );
        baseObject.template = "";
      }
    }

    // Load the model schema file
    try {
      const model_schema = await fileWriter.readTextFile(plugin.model_schema);
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

/**
 * Discovers and loads all plugins from the plugins directory
 * @param folderPath - The base folder path containing the plugins directory
 * @returns Promise resolving to an array of loaded Plugin objects
 * @throws Error if the plugins directory cannot be accessed or processed
 */
export async function getPlugins(folderPath: string): Promise<Plugin[]> {
  const configsArray: Plugin[] = [];
  const pluginPath = path.join(folderPath, "plugins");

  try {
    // Get all directories in the plugins folder
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
