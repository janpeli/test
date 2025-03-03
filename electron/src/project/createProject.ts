import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { FileWriter } from "../file-writer";

/**
 * Creates a new project using the FileWriter class for file operations
 * @param projectPath The path where the project should be created
 * @param projectName The name of the project
 * @returns Promise that resolves to the full project path or rejects with an error
 */
export async function createNewProject(
  projectPath: string,
  projectName: string
): Promise<string> {
  try {
    // Create the full project path
    const fullProjectPath = projectPath; //path.join(projectPath, projectName);

    // Check if directory already exists
    if (await directoryExists(fullProjectPath)) {
      throw new Error(`A directory already exists at ${fullProjectPath}`);
    }

    // Create main project directory
    await fs.promises.mkdir(fullProjectPath, { recursive: true });

    // Create the required subdirectories
    await fs.promises.mkdir(path.join(fullProjectPath, "models"), {
      recursive: true,
    });
    await fs.promises.mkdir(path.join(fullProjectPath, "plugins"), {
      recursive: true,
    });

    // Create project.yaml file with the project name using FileWriter
    const fileWriter = new FileWriter(fullProjectPath);
    const projectConfig = {
      project_name: projectName,
    };

    const yamlContent = yaml.stringify(projectConfig);
    await fileWriter.writeFile("project.yaml", yamlContent, {
      encoding: "utf-8",
      createDirs: false, // Directories are already created
    });

    console.log(
      `Project '${projectName}' created successfully at ${fullProjectPath}`
    );
    return fullProjectPath;
  } catch (error) {
    console.error(`Error creating project: ${error}`);
    throw error;
  }
}

/**
 * Helper function to check if a directory exists
 */
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.promises.stat(dirPath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}
