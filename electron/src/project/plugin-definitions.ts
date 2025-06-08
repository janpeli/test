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
 * Scans all plugin directories and loads their configuration
 * @returns {Array} Array of plugin objects with name, description, target_db, parser and uuid
 */
export function scanPlugins() {
  const pluginsPath = getPluginsPath();
  const plugins: PluginListType[] = [];

  try {
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
    // Read the file as a buffer
    const buffer = fs.readFileSync(imagePath);

    // Convert buffer to base64 string
    // This allows us to send it over IPC and use it directly in img src
    const base64Image = buffer.toString("base64");

    // Determine mime type based on file extension
    const ext = path.extname(imagePath).toLowerCase();
    let mimeType = "image/jpeg"; // default

    if (ext === ".png") mimeType = "image/png";
    else if (ext === ".gif") mimeType = "image/gif";
    else if (ext === ".svg") mimeType = "image/svg+xml";

    // Return as data URL that can be used directly in <img> tags
    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    console.error("Error reading image file:", error);
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

    // Find the plugin directory by UUID
    const plugins = scanPlugins();
    const targetPlugin = plugins.find((plugin) => plugin.uuid === uuid);

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
 * Helper function to recursively copy a folder and its contents
 * @param {string} source - Source folder path
 * @param {string} destination - Destination folder path
 */
function copyFolderRecursive(source: string, destination: string) {
  // Get all files and directories in the source folder
  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Create destination directory if it doesn't exist
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      // Recursively copy subdirectory
      copyFolderRecursive(sourcePath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

export default scanPlugins;
