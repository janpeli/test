import { Plugin, ProjectStructure, SaveFileProps } from "electron/src/project";

export interface IprojectAPI {
  openFolderDialog: () => Promise<string>;
  getFolderContents: (folderPath: string) => Promise<string>;
  getProjectStructure: (folderPath: string) => Promise<ProjectStructure>;
  getFileContent: ({ filePath: string, folderPath: string }) => Promise<string>;
  getProjectName: (folderPath: string) => Promise<string>;
  getPlugins: (folderPath: string) => Promise<Plugin[]>;
  saveFileContent: (props: SaveFileProps) => Promise<boolean>;
}

declare global {
  interface Window {
    project: IprojectAPI;
  }
}
