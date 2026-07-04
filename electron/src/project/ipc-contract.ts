// Single source of truth for the project IPC surface.
//
// Three layers derive from this file so they can never drift:
//   1. Main    — `setupIPCMain()` (./index.ts) registers one `ipcMain.handle`
//                per contract method, type-checked against `ProjectIpcContract`.
//   2. Preload — the context bridge (../context-bridges) builds the exposed
//                `window.project.*` object by looping over `METHOD_CHANNELS`.
//   3. Renderer — `src/index.d.ts` types `window.project` as `ProjectIpcContract`.
//
// Everything here is either a plain type (erased at build time) or the
// `METHOD_CHANNELS` string map, so importing this file into the preload bundle
// pulls in none of the main-only dependencies (nunjucks, simple-git, resvg, …):
// every cross-module import below is `import type` and therefore elided.

import type { ExportImageProps } from "./project";
import type { RenderProductProps, RenderProductResult } from "./products";
import type { SearchProjectProps, SearchResult } from "./search";
import type { GitInfo, GitCommit } from "./git";
import type {
  ValidationResult,
  ReloadPluginProps,
  CreatePluginFileProps,
} from "./plugin-validator";
import type { PluginListType } from "./plugin-definitions";

// ---------------------------------------------------------------------------
// Domain + request/response shapes.
//
// These formerly lived in ./index.ts; they moved here so the contract can
// reference them without importing from ./index.ts (which imports the runtime
// `METHOD_CHANNELS` from this file). ./index.ts re-exports every one of them,
// so existing imports from "electron/src/project" keep resolving unchanged.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// The contract.
//
// One method per IPC channel. Arg/result types differ per method, so this is
// spelled out explicitly rather than generated. `METHOD_CHANNELS` below is
// typed as `Record<keyof ProjectIpcContract, string>`, so the compiler forces
// exactly one channel name per method here (no missing, no extra).
// ---------------------------------------------------------------------------

export type ProjectIpcContract = {
  openFolderDialog: () => Promise<string>;
  getFolderContents: (folderPath: string) => Promise<string[]>;
  getProjectStructure: (folderPath: string) => Promise<ProjectStructure>;
  getFileContent: (props: {
    filePath: string;
    folderPath: string;
  }) => Promise<string>;
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
  copyProjectNode: (props: CopyProjectNodeProps) => Promise<{ newPath: string }>;
  renameProjectNode: (
    props: RenameProjectNodeProps
  ) => Promise<{ newPath: string }>;
  renderProduct: (props: RenderProductProps) => Promise<RenderProductResult>;
  searchProject: (props: SearchProjectProps) => Promise<SearchResult[]>;
  getGitInfo: (folderPath: string) => Promise<GitInfo>;
  getFileGitHistory: (
    folderPath: string,
    filePath: string
  ) => Promise<GitCommit[]>;
  getFileGitDiff: (
    folderPath: string,
    filePath: string,
    hash: string
  ) => Promise<string>;
  exportImage: (props: ExportImageProps) => Promise<string>;
  validatePluginFile: (props: {
    filePath: string;
    content: string;
  }) => Promise<ValidationResult>;
  reloadPlugin: (props: ReloadPluginProps) => Promise<Plugin>;
  createPluginFile: (props: CreatePluginFileProps) => Promise<boolean>;
};

// The single runtime source of channel names. Typed against the contract, so a
// method added/removed above (or a typo here) is a compile error.
export const METHOD_CHANNELS: Record<keyof ProjectIpcContract, string> = {
  openFolderDialog: "open-folder-dialog",
  getFolderContents: "get-folder-contents",
  getProjectStructure: "get-project-contents",
  getFileContent: "get-file-contents",
  getProjectName: "get-project-name",
  getPlugins: "get-plugins-contents",
  saveFileContent: "save-file-contents",
  createProject: "create-project",
  createFolder: "create-folder",
  getListOfPlugins: "get-list-of-plugins",
  copyPluginData: "copy-plugin-data",
  removePluginData: "remove-plugin-data",
  deleteFile: "delete-file",
  deleteFolder: "delete-folder",
  moveProjectNode: "move-project-node",
  copyProjectNode: "copy-project-node",
  renameProjectNode: "rename-project-node",
  renderProduct: "render-product",
  searchProject: "search-project",
  getGitInfo: "get-git-info",
  getFileGitHistory: "get-file-git-history",
  getFileGitDiff: "get-file-git-diff",
  exportImage: "export-image",
  validatePluginFile: "validate-plugin-file",
  reloadPlugin: "reload-plugin",
  createPluginFile: "create-plugin-file",
};
