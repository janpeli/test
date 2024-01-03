import { ipcRenderer, contextBridge } from "electron";

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
// Function to get folder contents
export function setupContextBridges() {
  const getFolderContents = (folderPath: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.send("get-folder-contents", folderPath);
      ipcRenderer.once("folder-contents", (_event, files) => {
        resolve(files);
      });
      ipcRenderer.once("folder-contents-error", (_event, error) => {
        reject(error);
      });
    });
  };
  // Function to open folder dialog
  const openFolderDialog = () => {
    return new Promise((resolve, _reject) => {
      ipcRenderer.send("open-folder-dialog");
      ipcRenderer.once("folder-selected", (_event, folderPath) => {
        resolve(folderPath);
      });
    });
  };

  const getProjectStructure = (folderPath: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.send("get-project-contents", folderPath);
      ipcRenderer.once("project-contents", (_event, data) => {
        resolve(data);
      });
      ipcRenderer.once("folder-contents-error", (_event, error) => {
        reject(error);
      });
    });
  };

  contextBridge.exposeInMainWorld("project", {
    openFolderDialog: openFolderDialog,
    getFolderContents: getFolderContents,
    getProjectStructure: getProjectStructure,
  });
}
