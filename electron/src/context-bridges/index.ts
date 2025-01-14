import { ipcRenderer, contextBridge, IpcRendererEvent } from "electron";
import { ProjectStructure } from "../project";

// --------- Expose some API to the Renderer process ---------
//contextBridge.exposeInMainWorld('ipcRenderer', withPrototype(ipcRenderer))
// `exposeInMainWorld` can't detect attributes and methods of `prototype`, manually patching it.
//function withPrototype(obj: Record<string, any>) {
//  const protos = Object.getPrototypeOf(obj)
//
//  for (const [key, value] of Object.entries(protos)) {
//    if (Object.prototype.hasOwnProperty.call(obj, key)) continue
//
//    if (typeof value === 'function') {
//      // Some native APIs, like `NodeJS.EventEmitter['on']`, don't work in the Renderer process. Wrapping them into a function.
//      obj[key] = function (...args: any) {
//        return value.call(obj, ...args)
//      }
//    } else {
//      obj[key] = value
//    }
//  }
//  return obj
//}

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

  const getFileContent = (filePath: string) =>
    createIpcRequest<string, string>(
      "get-file-contents",
      "file-contents",
      "file-contents-error",
      filePath
    );

  // Expose the methods to the renderer process
  contextBridge.exposeInMainWorld("project", {
    openFolderDialog,
    getFolderContents,
    getProjectStructure,
    getFileContent,
  });
}
