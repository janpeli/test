import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { FileWriter } from "../file-writer";
import { assertAbsoluteCleanPath } from "./utils";
import { getDataPath } from "./plugin-definitions";

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
  assertAbsoluteCleanPath(projectPath);
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
    // .claude holds AI assistant config (commands, agents, settings); surfaced
    // in the app's AI sidebar panel alongside CLAUDE.md.
    await fs.promises.mkdir(path.join(fullProjectPath, ".claude"), {
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

    // Seed self-documenting files for humans and AI assistants. These are
    // supplementary, so each is best-effort and must never block creation.
    await seedProjectDocs(fullProjectPath, projectName);

    return fullProjectPath;
  } catch (error) {
    console.error(`Error creating project: ${error}`);
    throw error;
  }
}

/**
 * Writes the project-level CLAUDE.md and copies PLUGIN_GUIDE.md into the new
 * project's plugins/ folder. Each step is independent and best-effort: a
 * failure (e.g. a missing source file) is logged but never blocks project
 * creation, and one failing step does not skip the other.
 */
async function seedProjectDocs(
  fullProjectPath: string,
  projectName: string
): Promise<void> {
  const dataPath = getDataPath();

  // CLAUDE.md — copy the shipped template with the project name interpolated.
  try {
    const template = await fs.promises.readFile(
      path.join(dataPath, "PROJECT_CLAUDE.md"),
      "utf-8"
    );
    await fs.promises.writeFile(
      path.join(fullProjectPath, "CLAUDE.md"),
      // Function replacement so a `$` in the project name is inserted
      // literally rather than interpreted as a replacement pattern ($&, $$, …).
      template.replaceAll("{{project_name}}", () => projectName),
      "utf-8"
    );
  } catch (error) {
    console.warn(`Could not write CLAUDE.md for new project: ${error}`);
  }

  // PLUGIN_GUIDE.md — copy the plugin authoring reference into plugins/.
  try {
    await fs.promises.copyFile(
      path.join(dataPath, "plugins", "PLUGIN_GUIDE.md"),
      path.join(fullProjectPath, "plugins", "PLUGIN_GUIDE.md")
    );
  } catch (error) {
    console.warn(`Could not copy PLUGIN_GUIDE.md for new project: ${error}`);
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
