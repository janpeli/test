import { ipcMain } from "electron";
import {
  createFolder,
  deleteFile,
  deleteFolder,
  exportImageFile,
  ExportImageProps,
  moveProjectNode,
  copyProjectNode,
  renameProjectNode,
  openFolderDialog,
  readFileData,
  readFolderContents,
  readProjectData,
  readProjectName,
  saveFileContent,
} from "./project";
import { createNewProject } from "./createProject";
import { getPlugins } from "./plugins";
import scanPlugins, {
  copyPluginData,
  removePluginData,
} from "./plugin-definitions";
import { renderProduct, RenderProductProps } from "./products";
import { searchProject, SearchProjectProps } from "./search";
import { getGitInfo, getFileGitHistory, getFileGitDiff } from "./git";
import {
  validatePluginFile,
  ValidationResult,
  ReloadPluginProps,
  CreatePluginFileProps,
} from "./plugin-validator";
import { loadPlugin } from "./plugins";
import path from "node:path";
import fs from "node:fs";

export type { RenderProductProps, RenderProductResult } from "./products";
export type { SearchProjectProps, SearchResult, SearchOptions } from "./search";
export type { GitInfo, GitCommit, GitRemote } from "./git";
export type { ExportImageProps } from "./project";
export type { ValidationResult, ReloadPluginProps, CreatePluginFileProps } from "./plugin-validator";

export type ProjectStructure = {
  id: string;
  isOpen: boolean;
  name: string;
  isFolder: boolean;
  isLeaf: boolean;
  children?: ProjectStructure[];
  sufix: string;
  plugin_uuid: string | null;
  isModel?: boolean;
};

export interface ProductDefinition {
  // Display name shown in the PRODUCT dropdown.
  name: string;
  // Path to the template file on disk; replaced with the file's contents
  // (the Nunjucks template source) after the plugin is loaded.
  definition: string;
  // Optional Monaco language id for syntax highlighting (e.g. "sql").
  language?: string;
  // Marks the product used when an object is dragged onto the canvas (phase 2).
  basic?: boolean;
}

interface BaseObject {
  name: string;
  definition: string;
  template: string;
  archetype: "entity" | "relation";
  sufix: string;
  products?: ProductDefinition[];
  icon?: string;
}

export interface Plugin {
  target_db: string | null;
  parser: string | null;
  base_objects: BaseObject[];
  model_schema: string;
  uuid: string;
  name: string;
  // Default Mermaid diagram keyword (e.g. "erDiagram") seeded at the start of a
  // newly created canvas file in a model belonging to this plugin.
  default_canvas_type?: string;
}

export type SaveFileProps = {
  filePath: string;
  folderPath: string;
  content: string;
};

export type CreateProjectProps = { folderPath: string; projectName: string };

export type CreateFolderProps = {
  projectPath: string;
  relativeFolderPath: string;
};

export type CopyPluginProps = { destinationFolderPath: string; uuid: string };

export type DeleteFileProps = { folderPath: string; filePath: string };

export type DeleteFolderProps = {
  folderPath: string;
  folderRelativePath: string;
};

export type MoveProjectNodeProps = {
  folderPath: string;
  srcPath: string;
  destFolderPath: string;
};

export type CopyProjectNodeProps = {
  folderPath: string;
  srcPath: string;
  destPath: string;
};

export type RenameProjectNodeProps = {
  folderPath: string;
  srcPath: string;
  newName: string;
};

export default function setupIPCMain() {
  ipcMain.handle("get-folder-contents", (_, folderPath: string) =>
    readFolderContents(folderPath)
  );

  ipcMain.handle("open-folder-dialog", () => openFolderDialog());

  ipcMain.handle("get-project-contents", (_, folderPath: string) =>
    readProjectData(folderPath)
  );

  ipcMain.handle(
    "get-file-contents",
    (_, props: { filePath: string; folderPath: string }) => readFileData(props)
  );

  ipcMain.handle("get-project-name", (_, filePath: string) =>
    readProjectName(filePath)
  );

  ipcMain.handle("get-plugins-contents", (_, folderPath: string) =>
    getPlugins(folderPath)
  );

  ipcMain.handle("save-file-contents", (_, props: SaveFileProps) =>
    saveFileContent(props)
  );

  ipcMain.handle("create-project", (_, props: CreateProjectProps) =>
    createNewProject(props.folderPath, props.projectName)
  );

  ipcMain.handle("create-folder", (_, props: CreateFolderProps) =>
    createFolder(props.projectPath, props.relativeFolderPath)
  );

  ipcMain.handle("get-list-of-plugins", () => scanPlugins());

  ipcMain.handle("copy-plugin-data", (_, props: CopyPluginProps) =>
    copyPluginData(props.destinationFolderPath, props.uuid)
  );

  ipcMain.handle("remove-plugin-data", (_, props: CopyPluginProps) =>
    removePluginData(props.destinationFolderPath, props.uuid)
  );

  ipcMain.handle("delete-file", (_, props: DeleteFileProps) =>
    deleteFile(props)
  );

  ipcMain.handle("delete-folder", (_, props: DeleteFolderProps) =>
    deleteFolder(props)
  );

  ipcMain.handle("move-project-node", (_, props: MoveProjectNodeProps) =>
    moveProjectNode(props)
  );

  ipcMain.handle("copy-project-node", (_, props: CopyProjectNodeProps) =>
    copyProjectNode(props)
  );

  ipcMain.handle("rename-project-node", (_, props: RenameProjectNodeProps) =>
    renameProjectNode(props)
  );

  ipcMain.handle("render-product", (_, props: RenderProductProps) =>
    renderProduct(props)
  );

  ipcMain.handle("search-project", (_, props: SearchProjectProps) =>
    searchProject(props)
  );

  ipcMain.handle("get-git-info", (_, folderPath: string) =>
    getGitInfo(folderPath)
  );

  ipcMain.handle(
    "get-file-git-history",
    (_, folderPath: string, filePath: string) =>
      getFileGitHistory(folderPath, filePath)
  );

  ipcMain.handle(
    "get-file-git-diff",
    (_, folderPath: string, filePath: string, hash: string) =>
      getFileGitDiff(folderPath, filePath, hash)
  );

  ipcMain.handle("export-image", (_, props: ExportImageProps) =>
    exportImageFile(props)
  );

  ipcMain.handle(
    "validate-plugin-file",
    (_, props: { filePath: string; content: string }): Promise<ValidationResult> =>
      validatePluginFile(props.filePath, props.content)
  );

  ipcMain.handle(
    "reload-plugin",
    async (_, props: ReloadPluginProps): Promise<Plugin | null> => {
      const configPath = path.join(props.folderPath, props.pluginDir, "config.yaml");
      try {
        return await loadPlugin(configPath);
      } catch (e) {
        console.error("reload-plugin failed:", e);
        return null;
      }
    }
  );

  ipcMain.handle(
    "create-plugin-file",
    async (_, props: CreatePluginFileProps): Promise<boolean> => {
      const fullPath = path.join(props.folderPath, props.filePath);
      try {
        await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.promises.writeFile(fullPath, props.content, "utf-8");
        return true;
      } catch (e) {
        console.error("create-plugin-file failed:", e);
        return false;
      }
    }
  );
}
