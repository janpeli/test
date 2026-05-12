import { ipcRenderer, contextBridge } from "electron";
import {
  CopyPluginProps,
  CreateFolderProps,
  CreateProjectProps,
  SaveFileProps,
} from "../project";

export function setupContextBridges() {
  contextBridge.exposeInMainWorld("project", {
    getFolderContents: (folderPath: string) =>
      ipcRenderer.invoke("get-folder-contents", folderPath),

    openFolderDialog: () => ipcRenderer.invoke("open-folder-dialog"),

    getProjectStructure: (folderPath: string) =>
      ipcRenderer.invoke("get-project-contents", folderPath),

    getFileContent: (props: { filePath: string; folderPath: string }) =>
      ipcRenderer.invoke("get-file-contents", props),

    getProjectName: (filePath: string) =>
      ipcRenderer.invoke("get-project-name", filePath),

    getPlugins: (folderPath: string) =>
      ipcRenderer.invoke("get-plugins-contents", folderPath),

    saveFileContent: (props: SaveFileProps) =>
      ipcRenderer.invoke("save-file-contents", props),

    createProject: (props: CreateProjectProps) =>
      ipcRenderer.invoke("create-project", props),

    createFolder: (props: CreateFolderProps) =>
      ipcRenderer.invoke("create-folder", props),

    getListOfPlugins: () => ipcRenderer.invoke("get-list-of-plugins"),

    copyPluginData: (props: CopyPluginProps) =>
      ipcRenderer.invoke("copy-plugin-data", props),

    removePluginData: (props: CopyPluginProps) =>
      ipcRenderer.invoke("remove-plugin-data", props),
  });
}
