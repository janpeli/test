import {
  Plugin,
  ProjectStructure,
  SaveFileProps,
  CreateProjectProps,
  CreateFolderProps,
  CopyPluginProps,
  DeleteFileProps,
  DeleteFolderProps,
  MoveProjectNodeProps,
  RenameProjectNodeProps,
  RenderProductProps,
  RenderProductResult,
  GitInfo,
  ExportImageProps,
  ValidationResult,
  ReloadPluginProps,
  CreatePluginFileProps,
} from "electron/src/project";
import { PluginListType } from "electron/src/project/plugin-definitions";

export interface IprojectAPI {
  openFolderDialog: () => Promise<string>;
  getFolderContents: (folderPath: string) => Promise<string[]>;
  getProjectStructure: (folderPath: string) => Promise<ProjectStructure>;
  getFileContent: (props: { filePath: string; folderPath: string }) => Promise<string>;
  getProjectName: (folderPath: string) => Promise<string>;
  getPlugins: (folderPath: string) => Promise<Plugin[]>;
  saveFileContent: (props: SaveFileProps) => Promise<boolean>;
  createProject: (props: CreateProjectProps) => Promise<string>;
  createFolder: (props: CreateFolderProps) => Promise<string>;
  getListOfPlugins: () => Promise<PluginListType[]>;
  copyPluginData: (props: CopyPluginProps) => Promise<boolean>;
  removePluginData: (props: CopyPluginProps) => Promise<boolean>;
  deleteFile: (props: DeleteFileProps) => Promise<boolean>;
  deleteFolder: (props: DeleteFolderProps) => Promise<boolean>;
  moveProjectNode: (props: MoveProjectNodeProps) => Promise<{ newPath: string }>;
  renameProjectNode: (props: RenameProjectNodeProps) => Promise<{ newPath: string }>;
  renderProduct: (props: RenderProductProps) => Promise<RenderProductResult>;
  getGitInfo: (folderPath: string) => Promise<GitInfo>;
  exportImage: (props: ExportImageProps) => Promise<string>;
  validatePluginFile: (props: { filePath: string; content: string }) => Promise<ValidationResult>;
  reloadPlugin: (props: ReloadPluginProps) => Promise<Plugin | null>;
  createPluginFile: (props: CreatePluginFileProps) => Promise<boolean>;
}

declare global {
  interface Window {
    project: IprojectAPI;
  }
}
