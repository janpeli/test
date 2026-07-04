import { ipcMain } from "electron";
import {
  createFolder,
  deleteFile,
  deleteFolder,
  exportImageFile,
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
import { getPlugins, loadPlugin } from "./plugins";
import scanPlugins, {
  copyPluginData,
  removePluginData,
} from "./plugin-definitions";
import { renderProduct } from "./products";
import { searchProject } from "./search";
import { getGitInfo, getFileGitHistory, getFileGitDiff } from "./git";
import { validatePluginFile } from "./plugin-validator";
import path from "node:path";
import fs from "node:fs";
import { METHOD_CHANNELS, type ProjectIpcContract } from "./ipc-contract";

// The IPC contract is the single source of truth (./ipc-contract.ts). Re-export
// its domain + request/response types so existing imports from
// "electron/src/project" (renderer + sibling main modules) keep resolving here.
export type {
  ProjectStructure,
  ProductDefinition,
  Plugin,
  SaveFileProps,
  SaveFileResult,
  CreateProjectProps,
  CreateFolderProps,
  CopyPluginProps,
  DeleteFileProps,
  DeleteFolderProps,
  MoveProjectNodeProps,
  CopyProjectNodeProps,
  RenameProjectNodeProps,
  ProjectIpcContract,
} from "./ipc-contract";
export type { RenderProductProps, RenderProductResult } from "./products";
export type { SearchProjectProps, SearchResult, SearchOptions } from "./search";
export type { GitInfo, GitCommit, GitRemote } from "./git";
export type { ExportImageProps } from "./project";
export type { ValidationResult, ReloadPluginProps, CreatePluginFileProps } from "./plugin-validator";

// One handler per contract method, checked against `ProjectIpcContract`: a
// signature that drifts from the contract is a compile error, and the object
// literal being typed as the full map forces exactly one entry per method (the
// completeness check the loop below cannot provide at runtime). Handlers may
// return either the value or a promise of it (ipcMain.handle awaits both).
type HandlerMap = {
  [K in keyof ProjectIpcContract]: (
    ...args: Parameters<ProjectIpcContract[K]>
  ) => Awaited<ReturnType<ProjectIpcContract[K]>> | ReturnType<ProjectIpcContract[K]>;
};

const handlers: HandlerMap = {
  getFolderContents: (folderPath) => readFolderContents(folderPath),
  openFolderDialog: () => openFolderDialog(),
  getProjectStructure: (folderPath) => readProjectData(folderPath),
  getFileContent: (props) => readFileData(props),
  getProjectName: (filePath) => readProjectName(filePath),
  getPlugins: (folderPath) => getPlugins(folderPath),
  saveFileContent: (props) => saveFileContent(props),
  createProject: (props) => createNewProject(props.folderPath, props.projectName),
  createFolder: (props) => createFolder(props.projectPath, props.relativeFolderPath),
  getListOfPlugins: () => scanPlugins(),
  copyPluginData: (props) => copyPluginData(props.destinationFolderPath, props.uuid),
  removePluginData: (props) => removePluginData(props.destinationFolderPath, props.uuid),
  deleteFile: (props) => deleteFile(props),
  deleteFolder: (props) => deleteFolder(props),
  moveProjectNode: (props) => moveProjectNode(props),
  copyProjectNode: (props) => copyProjectNode(props),
  renameProjectNode: (props) => renameProjectNode(props),
  renderProduct: (props) => renderProduct(props),
  searchProject: (props) => searchProject(props),
  getGitInfo: (folderPath) => getGitInfo(folderPath),
  getFileGitHistory: (folderPath, filePath) =>
    getFileGitHistory(folderPath, filePath),
  getFileGitDiff: (folderPath, filePath, hash) =>
    getFileGitDiff(folderPath, filePath, hash),
  exportImage: (props) => exportImageFile(props),
  validatePluginFile: (props) => validatePluginFile(props.filePath, props.content),
  reloadPlugin: async (props) => {
    const configPath = path.join(props.folderPath, props.pluginDir, "config.yaml");
    return await loadPlugin(configPath);
  },
  createPluginFile: async (props) => {
    const fullPath = path.join(props.folderPath, props.filePath);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, props.content, "utf-8");
    return true;
  },
};

export default function setupIPCMain() {
  (Object.keys(handlers) as (keyof ProjectIpcContract)[]).forEach((method) => {
    const handler = handlers[method] as (...args: unknown[]) => unknown;
    ipcMain.handle(METHOD_CHANNELS[method], (_event, ...args) => handler(...args));
  });
}
