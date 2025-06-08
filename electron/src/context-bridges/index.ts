import { ipcRenderer, contextBridge, IpcRendererEvent } from "electron";
import {
  CopyPluginProps,
  CreateFolderProps,
  CreateProjectProps,
  Plugin,
  ProjectStructure,
  SaveFileProps,
} from "../project";
import { PluginListType } from "../project/plugin-definitions";
//import path from "node:path";

export function setupContextBridges() {
  // Generic IPC request handler with cleanup and timeout
  const createIpcRequest = <T, T2>(
    sendChannel: string,
    successChannel: string,
    errorChannel: string,
    payload?: T2,
    timeout: number = 30000
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const successHandler = (_event: IpcRendererEvent, data: T) => {
        cleanup();
        resolve(data);
      };

      const errorHandler = (_event: IpcRendererEvent, error: string) => {
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        ipcRenderer.removeListener(successChannel, successHandler);
        ipcRenderer.removeListener(errorChannel, errorHandler);
        if (timeoutId) clearTimeout(timeoutId);
      };

      // Set up listeners
      ipcRenderer.on(successChannel, successHandler);
      ipcRenderer.on(errorChannel, errorHandler);

      // Send the request
      ipcRenderer.send(sendChannel, payload);

      // Set timeout
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(
          new Error(
            `IPC request to ${sendChannel} timed out after ${timeout}ms`
          )
        );
      }, timeout);
    });
  };

  // Specific implementations using the generic handler
  const getFolderContents = (folderPath: string) =>
    createIpcRequest<string[], string>(
      "get-folder-contents",
      "folder-contents",
      "folder-contents-error",
      folderPath
    );

  const openFolderDialog = () =>
    createIpcRequest<string, void>(
      "open-folder-dialog",
      "folder-selected",
      "folder-selected-error"
    );

  const getProjectStructure = (folderPath: string) =>
    createIpcRequest<ProjectStructure, string>(
      "get-project-contents",
      "project-contents",
      "project-contents-error",
      folderPath
    );

  const getPlugins = (folderPath: string) =>
    createIpcRequest<Plugin[], string>(
      "get-plugins-contents",
      "plugins-contents",
      "plugins-contents-error",
      folderPath
    );

  const getFileContent = (props: { filePath: string; folderPath: string }) =>
    createIpcRequest<string, { filePath: string; folderPath: string }>(
      "get-file-contents",
      "file-contents",
      "file-contents-error",
      props
    );

  const getProjectName = (filePath: string) =>
    createIpcRequest<string, string>(
      "get-project-name",
      "project-name",
      "project-name-error",
      filePath
    );

  const saveFileContent = (props: SaveFileProps) =>
    createIpcRequest<boolean, SaveFileProps>(
      "save-file-contents",
      "save-file-status",
      "save-file-status-error",
      props
    );

  const createProject = (props: CreateProjectProps) =>
    createIpcRequest<boolean, CreateProjectProps>(
      "create-project",
      "create-project-status",
      "create-project-status-error",
      props
    );

  const createFolder = (props: CreateFolderProps) =>
    createIpcRequest<boolean, CreateFolderProps>(
      "create-folder",
      "create-folder-status",
      "create-folder-status-error",
      props
    );

  const getListOfPlugins = () =>
    createIpcRequest<PluginListType[], void>(
      "get-list-of-plugins",
      "get-list-of-plugins-status",
      "get-list-of-plugins-error"
    );

  const copyPluginData = (props: CopyPluginProps) =>
    createIpcRequest<boolean, CopyPluginProps>(
      "copy-plugin-data",
      "copy-plugin-data-status",
      "copy-plugin-data-error",
      props
    );

  // Expose the methods to the renderer process
  contextBridge.exposeInMainWorld("project", {
    openFolderDialog,
    getFolderContents,
    getProjectStructure,
    getFileContent,
    getProjectName,
    getPlugins,
    saveFileContent,
    createProject,
    createFolder,
    getListOfPlugins,
    copyPluginData,
  });
}
