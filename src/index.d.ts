export interface IprojectAPI {
  openFolderDialog: () => Promise<string>;
  getFolderContents: (folderPath: string) => Promise<string>;
  getProjectStructure: (folderPath: string) => Promise<ProjectStructure>;
  getFileContent: (filePath: string) => Promise<string>;
}

declare global {
  interface Window {
    project: IprojectAPI;
  }
}
