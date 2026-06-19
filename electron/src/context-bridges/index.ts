import { ipcRenderer, contextBridge } from "electron";
import {
  CopyPluginProps,
  CreateFolderProps,
  CreateProjectProps,
  CreatePluginFileProps,
  DeleteFileProps,
  DeleteFolderProps,
  ExportImageProps,
  MoveProjectNodeProps,
  RenameProjectNodeProps,
  ReloadPluginProps,
  RenderProductProps,
  SaveFileProps,
  ValidationResult,
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

    deleteFile: (props: DeleteFileProps) =>
      ipcRenderer.invoke("delete-file", props),

    deleteFolder: (props: DeleteFolderProps) =>
      ipcRenderer.invoke("delete-folder", props),

    moveProjectNode: (props: MoveProjectNodeProps) =>
      ipcRenderer.invoke("move-project-node", props),

    renameProjectNode: (props: RenameProjectNodeProps) =>
      ipcRenderer.invoke("rename-project-node", props),

    renderProduct: (props: RenderProductProps) =>
      ipcRenderer.invoke("render-product", props),

    getGitInfo: (folderPath: string) =>
      ipcRenderer.invoke("get-git-info", folderPath),

    exportImage: (props: ExportImageProps) =>
      ipcRenderer.invoke("export-image", props),

    validatePluginFile: (props: {
      filePath: string;
      content: string;
    }): Promise<ValidationResult> =>
      ipcRenderer.invoke("validate-plugin-file", props),

    reloadPlugin: (props: ReloadPluginProps): Promise<import("../project").Plugin | null> =>
      ipcRenderer.invoke("reload-plugin", props),

    createPluginFile: (props: CreatePluginFileProps): Promise<boolean> =>
      ipcRenderer.invoke("create-plugin-file", props),
  });
}
