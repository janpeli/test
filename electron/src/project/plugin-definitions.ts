import fs from "fs";
import path from "path";
import yaml from "yaml";
import { app } from "electron";

export type PluginListType = {
  name: string;
  description: string;
  target_db: string;
  parser: string;
  uuid: string;
  directory: string;
  image: string | null;
};

// Determine the base path for the plugins directory
const getPluginsPath = () => {
  if (app.isPackaged) {
    // In production - use the path relative to resources directory
    return path.join(path.dirname(app.getAppPath()), "data", "plugins");
  } else {
    // In development
    return path.join(__dirname, "../data", "plugins");
  }
};

/**
 * Validates plugin configuration object
 * @param config - Configuration object to validate
 * @returns boolean indicating if config is valid
 */
function validatePluginConfig(config: unknown): boolean {
  if (!config || typeof config !== "object") {
    return false;
  }

  const configObj = config as Record<string, unknown>;
  const required = ["name", "description", "target_db", "parser", "uuid"];

  return required.every(
    (field) => configObj[field] && typeof configObj[field] === "string"
  );
}

/**
 * Scans all plugin directories and loads their configuration
 * @returns {PluginListType[]} Array of plugin objects with name, description, target_db, parser and uuid
 */
export function scanPlugins(
  source: string = getPluginsPath()
): PluginListType[] {
  const pluginsPath = source;
  const plugins: PluginListType[] = [];

  try {
    // Check if plugins directory exists
    if (!fs.existsSync(pluginsPath)) {
      console.warn(`Plugins directory does not exist: ${pluginsPath}`);
      return [];
    }

    // Get all subdirectories in the plugins folder
    const pluginDirs = fs.readdirSync(pluginsPath).filter((file) => {
      const fullPath = path.join(pluginsPath, file);
      return fs.statSync(fullPath).isDirectory();
    });

    // Process each plugin directory
    for (const pluginDir of pluginDirs) {
      const configPath = path.join(pluginsPath, pluginDir, "config.yaml");

      // Check if config.yaml exists
      if (fs.existsSync(configPath)) {
        try {
          // Read and parse the YAML file
          const configContent = fs.readFileSync(configPath, "utf8");
          const config = yaml.parse(configContent);

          // Validate required fields
          if (!validatePluginConfig(config)) {
            console.error(
              `Invalid config for plugin ${pluginDir}: missing required fields`
            );
            continue;
          }

          // Extract the required attributes
          const { name, description, target_db, parser, uuid } = config;
          const imageData = config.image
            ? getImageData(path.resolve(pluginsPath, pluginDir, config.image))
            : null;

          // Add to plugins array
          plugins.push({
            name,
            description,
            target_db,
            parser,
            uuid,
            directory: pluginDir,
            image: imageData,
          });
        } catch (err) {
          console.error(`Error reading config for plugin ${pluginDir}:`, err);
        }
      } else {
        console.warn(`Plugin ${pluginDir} is missing config.yaml file`);
      }
    }

    return plugins;
  } catch (err) {
    console.error("Error scanning plugins directory:", err);
    return [];
  }
}

/**
 * Reads an image file and converts it to a base64 data URL for use in HTML img tags
 * @param imagePath - The file path to the image to read
 * @returns A data URL string (data:image/type;base64,data) that can be used directly in img src attributes, or null if the file cannot be read
 */
function getImageData(imagePath: string) {
  try {
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.warn(`Image file does not exist: ${imagePath}`);
      return null;
    }

    // Read the file as a buffer
    const buffer = fs.readFileSync(imagePath);

    // Convert buffer to base64 string
    // This allows us to send it over IPC and use it directly in img src
    const base64Image = buffer.toString("base64");

    // Determine mime type based on file extension
    const ext = path.extname(imagePath).toLowerCase();
    let mimeType = "image/jpeg"; // default

    switch (ext) {
      case ".png":
        mimeType = "image/png";
        break;
      case ".gif":
        mimeType = "image/gif";
        break;
      case ".svg":
        mimeType = "image/svg+xml";
        break;
      case ".webp":
        mimeType = "image/webp";
        break;
      case ".bmp":
        mimeType = "image/bmp";
        break;
      default:
        mimeType = "image/jpeg";
    }

    // Return as data URL that can be used directly in <img> tags
    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    console.error("Error reading image file:", error);
    return null;
  }
}

/**
 * More efficient plugin lookup by UUID - scans directories until found
 * @param uuid - UUID of the plugin to find
 * @param source - Optional source directory to search in (defaults to main plugins directory)
 * @returns PluginListType object if found, null otherwise
 */
function findPluginByUuid(
  uuid: string,
  source?: string
): PluginListType | null {
  const pluginsPath = source || getPluginsPath();

  try {
    // Check if plugins directory exists
    if (!fs.existsSync(pluginsPath)) {
      console.warn(`Plugins directory does not exist: ${pluginsPath}`);
      return null;
    }

    // Get all subdirectories in the plugins folder
    const pluginDirs = fs.readdirSync(pluginsPath).filter((file) => {
      const fullPath = path.join(pluginsPath, file);
      return fs.statSync(fullPath).isDirectory();
    });

    for (const pluginDir of pluginDirs) {
      const configPath = path.join(pluginsPath, pluginDir, "config.yaml");
      if (fs.existsSync(configPath)) {
        try {
          const configContent = fs.readFileSync(configPath, "utf8");
          const config = yaml.parse(configContent);

          if (config.uuid === uuid) {
            // Validate the config before returning
            if (!validatePluginConfig(config)) {
              console.error(
                `Invalid config for plugin ${pluginDir}: missing required fields`
              );
              continue;
            }

            const imageData = config.image
              ? getImageData(path.resolve(pluginsPath, pluginDir, config.image))
              : null;

            return {
              name: config.name,
              description: config.description,
              target_db: config.target_db,
              parser: config.parser,
              uuid: config.uuid,
              directory: pluginDir,
              image: imageData,
            };
          }
        } catch (err) {
          console.error(`Error reading config for plugin ${pluginDir}:`, err);
          continue;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding plugin by UUID:", error);
    return null;
  }
}

/**
 * Copies plugin data to a specified folder based on the UUID
 * @param {string} destinationFolderPath - Path where plugin data should be copied to
 * @param {string} uuid - UUID of the plugin to be copied
 * @returns {boolean} Success or failure of the copy operation
 */
export function copyPluginData(
  destinationFolderPath: string,
  uuid: string
): boolean {
  console.log("copyPluginData called");
  try {
    const pluginsPath = getPluginsPath();

    // Find the plugin by UUID (more efficient than scanning all plugins)
    const targetPlugin = findPluginByUuid(uuid);

    if (!targetPlugin) {
      console.error(`Plugin with UUID ${uuid} not found`);
      return false;
    }

    const sourcePluginPath = path.join(pluginsPath, targetPlugin.directory);

    // Create the plugins folder in the destination if it doesn't exist
    const pluginsDestinationPath = path.join(destinationFolderPath, "plugins");
    if (!fs.existsSync(pluginsDestinationPath)) {
      fs.mkdirSync(pluginsDestinationPath, { recursive: true });
    }

    // Create the actual plugin folder destination
    const finalDestinationPath = path.join(
      pluginsDestinationPath,
      targetPlugin.directory
    );

    // Check if plugin already exists and throw error
    if (fs.existsSync(finalDestinationPath)) {
      throw new Error(
        `Plugin ${targetPlugin.name} already exists in the destination folder`
      );
    }

    // Create the plugin folder
    fs.mkdirSync(finalDestinationPath, { recursive: true });

    // Copy all files from source plugin directory to the new plugin folder
    copyFolderRecursive(sourcePluginPath, finalDestinationPath);

    console.log(
      `Successfully copied plugin ${targetPlugin.name} to ${finalDestinationPath}`
    );
    return true;
  } catch (error) {
    console.error("Error copying plugin data:", error);
    return false;
  }
}

/**
 * Removes plugin data from a specified folder based on the UUID
 * @param {string} destinationFolderPath - Path where plugin data should be removed from
 * @param {string} uuid - UUID of the plugin to be removed
 * @returns {boolean} Success or failure of the removal operation
 */
export function removePluginData(
  destinationFolderPath: string,
  uuid: string
): boolean {
  console.log("removePluginData called");
  try {
    const pluginsDestinationPath = path.join(destinationFolderPath, "plugins");

    // Check if plugins directory exists
    if (!fs.existsSync(pluginsDestinationPath)) {
      console.warn(
        `Plugins directory does not exist: ${pluginsDestinationPath}`
      );
      return false;
    }

    // Find the plugin by UUID in the destination directory
    const plugin = findPluginByUuid(uuid, pluginsDestinationPath);

    if (!plugin) {
      console.error(`Plugin with UUID ${uuid} not found`);
      return false;
    }

    const pluginPath = path.resolve(pluginsDestinationPath, plugin.directory);

    // Check if plugin directory exists
    if (!fs.existsSync(pluginPath)) {
      console.warn(`Plugin directory does not exist: ${pluginPath}`);
      return false;
    }

    // Remove the plugin directory and all its contents recursively
    fs.rmSync(pluginPath, { recursive: true, force: true });

    console.log(
      `Successfully removed plugin ${plugin.name} from ${pluginPath}`
    );
    return true;
  } catch (error) {
    console.error("Error removing plugin data:", error);
    return false;
  }
}

/**
 * Helper function to recursively copy a folder and its contents
 * @param {string} source - Source folder path
 * @param {string} destination - Destination folder path
 */
function copyFolderRecursive(source: string, destination: string): void {
  try {
    const entries = fs.readdirSync(source, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);

      if (entry.isSymbolicLink()) {
        // Skip symlinks to avoid security issues
        console.warn(`Skipping symlink: ${sourcePath}`);
        continue;
      }

      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyFolderRecursive(sourcePath, destPath);
      } else if (entry.isFile()) {
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to copy from ${source} to ${destination}: ${error}`
    );
  }
}

export default scanPlugins;
