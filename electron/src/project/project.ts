import { dialog } from "electron";
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { Resvg } from "@resvg/resvg-js";

import { ProjectStructure, SaveFileProps, SaveFileResult } from "./index.ts";
import { FileWriter } from "../file-writer";
import { assertAbsoluteCleanPath } from "./utils";

/**
 * Reads the contents of a folder and returns an array of file/folder names
 * @param folderPath - The path to the folder to read
 * @returns Promise resolving to an array of file and folder names
 */
export async function readFolderContents(
  folderPath: string,
): Promise<string[]> {
  assertAbsoluteCleanPath(folderPath);
  const files = await fs.promises.readdir(folderPath);
  return files;
}

/**
 * Reads the content of a specific file using FileWriter
 * @param props - Object containing filePath and folderPath
 * @param props.filePath - The path to the file to read
 * @param props.folderPath - The base folder path
 * @returns Promise resolving to the file content plus its on-disk mtime (ms).
 *          The mtime is the baseline for the save-time external-change check;
 *          it is 0 when the file cannot be stat'd.
 */
export async function readFileData(props: {
  filePath: string;
  folderPath: string;
}): Promise<{ content: string; mtimeMs: number }> {
  assertAbsoluteCleanPath(props.folderPath);
  const fileWriter = new FileWriter(props.folderPath);
  const content = await fileWriter.readTextFile(props.filePath);
  const mtimeMs = await fileWriter.statMtimeMs(props.filePath);
  return { content, mtimeMs };
}

/**
 * Reads the project name from a project.yaml file in the specified folder
 * @param folderPath - The path to the folder containing project.yaml
 * @returns Promise resolving to the project name or empty string if not found
 */
export async function readProjectName(folderPath: string): Promise<string> {
  assertAbsoluteCleanPath(folderPath);
  const project_path = path.join(folderPath, "project.yaml");
  const fileContent = await fs.promises.readFile(project_path, {
    encoding: "utf-8",
  });
  const y = yaml.parse(fileContent);
  if (Object.keys(y).includes("project_name")) {
    const result = y["project_name"];
    if (typeof result === "string") return result;
  }
  return "";
}

/**
 * Opens a folder selection dialog and returns the selected folder path
 * @returns Promise resolving to the selected folder path or empty string if canceled
 */
export async function openFolderDialog(): Promise<string> {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return "";
}

export type ExportImageProps = {
  // Suggested file name shown in the save dialog (e.g. "my-diagram.png").
  defaultFileName: string;
  format: "png" | "svg";
  // SVG markup with an explicit pixel size pinned on the root <svg>. For "svg"
  // it is written verbatim (background already baked in by the renderer); for
  // "png" resvg rasterises it.
  svg: string;
  // Zoom multiplier applied to the SVG's intrinsic size (PNG only).
  scale: number;
  // PNG only — the SVG path bakes its own background in the renderer. A
  // resolved CSS color (e.g. "#ffffff"/"#2b2b2b" for a light/dark solid
  // background) or `null` for transparent; the renderer resolves which color
  // a "solid" choice means (it depends on the export theme), main just paints
  // whatever it's given.
  background: string | null;
};

// Must match `DIAGRAM_FONT_FAMILY` in `src/lib/canvas/mermaid-init.ts` — the
// single concrete font name Mermaid is configured to emit, so resvg's fallback
// resolution lands on the same font Chromium uses for the on-screen canvas
// instead of an arbitrary system font (resvg's own default for an unresolved
// name is "the first font in the list of system fonts").
const DIAGRAM_FONT_FAMILY = "Arial";

/**
 * Rasterises a Mermaid SVG to a PNG buffer with resvg (a headless, GPU-free
 * renderer). Because Mermaid is configured to emit labels as native SVG <text>
 * (not <foreignObject>), resvg renders them faithfully. Unlike a BrowserWindow
 * capture, resvg has no window/screen-size clamp, no paint-timing race, and
 * honours transparency — so output is deterministic at any scale.
 */
function rasterizeSvgToPng(
  svg: string,
  scale: number,
  background: string | null,
): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "zoom", value: scale > 0 ? scale : 1 },
    // Omit `background` for a transparent PNG; resvg keeps the alpha channel.
    background: background ?? undefined,
    font: {
      loadSystemFonts: true,
      sansSerifFamily: DIAGRAM_FONT_FAMILY,
      defaultFontFamily: DIAGRAM_FONT_FAMILY,
    },
  });
  return Buffer.from(resvg.render().asPng());
}

/**
 * Opens a native save dialog for a rendered diagram and writes it to the chosen
 * path. The destination is user-picked and arbitrary, so this writes directly
 * with `fs` rather than the base-dir-scoped fileWriter.
 *
 * @returns The saved file path, or an empty string if the dialog was canceled.
 */
export async function exportImageFile(props: ExportImageProps): Promise<string> {
  const { defaultFileName, format, svg, scale, background } = props;

  const result = await dialog.showSaveDialog({
    defaultPath: defaultFileName,
    filters: [
      format === "svg"
        ? { name: "SVG Image", extensions: ["svg"] }
        : { name: "PNG Image", extensions: ["png"] },
    ],
  });

  if (result.canceled || !result.filePath) return "";

  const buffer =
    format === "svg"
      ? Buffer.from(svg, "utf8")
      : rasterizeSvgToPng(svg, scale, background);

  await fs.promises.writeFile(result.filePath, buffer);
  return result.filePath;
}

/**
 * Reads and builds the complete project structure recursively
 * @param folderPath - The root folder path of the project
 * @returns Promise resolving to the complete ProjectStructure object
 */
export async function readProjectData(
  folderPath: string,
): Promise<ProjectStructure> {
  assertAbsoluteCleanPath(folderPath);
  let rp = path.normalize(folderPath);
  if (path.sep === "/") {
    rp = rp.replace(/\\/g, "/");
  }

  const projectStructure: ProjectStructure = {
    id: rp,
    isOpen: true,
    name: path.basename(rp),
    isFolder: true,
    isLeaf: false,
    children: await readProjectDataRecurisive(rp, rp),
    sufix: "",
    plugin_uuid: "",
  };
  traverseProjectStructure(projectStructure, (projectStructure) => {
    if (projectStructure.children && !projectStructure.plugin_uuid) {
      const model_definition = projectStructure.children.find(
        (file) => file.sufix.toLocaleLowerCase().normalize().trim() === "mdl",
      );
      if (model_definition) {
        projectStructure.plugin_uuid = model_definition.plugin_uuid;
        projectStructure.isModel = true;
      }
    }
  });
  return projectStructure;
}

/**
 * Traverses a project structure tree and executes a callback function on each node
 * @param node - The current ProjectStructure node to process
 * @param callback - Function to execute on each node during traversal
 */
export function traverseProjectStructure(
  node: ProjectStructure,
  callback: (node: ProjectStructure) => void,
) {
  // Process current node
  callback(node);

  // Process children
  if (node.children) {
    node.children.forEach((child) => traverseProjectStructure(child, callback));
  }
}

/**
 * Finds and extracts the plugin_uuid from a file content using regex
 * @param filePath - The path to the file to search in
 * @returns The plugin UUID string or empty string if not found
 */
function findPluginUuidWholeFile(filePath: string): string | "" {
  const content = fs.readFileSync(filePath, "utf8");
  const expresion = new RegExp("plugin_uuid:\\s*(.*)", "m");
  const match = content.match(expresion);
  return match ? match[1].trim() : "";
}

/**
 * Recursively reads project data and builds the project structure tree
 * @param folderPath - The current folder path being processed
 * @param rootPath - The root path of the project (used for relative path calculation)
 * @param plugin_uuid - The plugin UUID to inherit for child nodes (optional)
 * @returns Promise resolving to an array of ProjectStructure objects representing the folder contents
 */
async function readProjectDataRecurisive(
  folderPath: string,
  rootPath: string,
  plugin_uuid: string = "",
): Promise<ProjectStructure[]> {
  const entries = await fs.promises.readdir(folderPath, {
    withFileTypes: true,
  });

  // if there is a model we read a model uuid to know which plug in we are using for that file
  let current_uuid = plugin_uuid;
  if (current_uuid === "") {
    for (const entry of entries) {
      const splitName = entry.name.split(".");
      const sufix =
        !entry.isDirectory() && splitName.length > 2
          ? splitName[splitName.length - 2]
          : "";
      if (sufix.toLocaleLowerCase() === "mdl") {
        current_uuid = findPluginUuidWholeFile(
          path.join(folderPath, entry.name),
        );
      }
    }
  }

  const children: ProjectStructure[] = [];
  for (const entry of entries) {
    const currentPath = path.join(folderPath, entry.name);
    // Calculate relative path by removing the rootPath from the currentPath
    const relativePath = path.relative(rootPath, currentPath).replace(/\\/g, "/");
    const splitName = entry.name.split(".");
    const lastDotIndex = entry.name.lastIndexOf(".");
    const name =
      lastDotIndex > -1 ? entry.name.slice(0, lastDotIndex) : entry.name;

    const fileExtension = !entry.isDirectory()
      ? splitName[splitName.length - 1]
      : "";
    let sufix = "";
    if (
      fileExtension &&
      splitName.length > 2 &&
      ["yaml", "yml"].includes(fileExtension.toLocaleLowerCase())
    ) {
      sufix = splitName[splitName.length - 2];
    } else {
      sufix = fileExtension;
    }

    const child: ProjectStructure = {
      id: relativePath, // Now using relative path instead of full path
      isOpen: false,
      name: name,
      isFolder: entry.isDirectory(),
      isLeaf: !entry.isDirectory(),
      children: entry.isDirectory()
        ? await readProjectDataRecurisive(currentPath, rootPath, current_uuid)
        : undefined,
      sufix: sufix,
      plugin_uuid: current_uuid,
      isModel: false,
    };
    children.push(child);
  }

  return children;
}

/**
 * Saves content to a file using the FileWriter utility
 * @param props - Object containing save file properties
 * @param props.folderPath - The base folder path
 * @param props.filePath - The relative path to the file to save
 * @param props.content - The content to write to the file
 * @param props.expectedMtimeMs - When > 0, the mtime the renderer last saw. If
 *        the file on disk still exists and its mtime differs, the file was
 *        changed externally: the write is refused and a conflict is returned.
 *        Omitted/0 skips the check (new files, or a user-confirmed overwrite).
 * @returns `{ ok: true, mtimeMs }` with the fresh mtime after writing, or
 *          `{ ok: false, conflict: true, currentMtimeMs }` when refused.
 */
export async function saveFileContent(
  props: SaveFileProps,
): Promise<SaveFileResult> {
  assertAbsoluteCleanPath(props.folderPath);
  const fileWriter = new FileWriter(props.folderPath);

  if (props.expectedMtimeMs && props.expectedMtimeMs > 0) {
    const currentMtimeMs = await fileWriter.statMtimeMs(props.filePath);
    // currentMtimeMs === 0 means the file no longer exists — a plain write
    // recreates it, so that is not treated as a conflict.
    if (currentMtimeMs > 0 && currentMtimeMs !== props.expectedMtimeMs) {
      return { ok: false, conflict: true, currentMtimeMs };
    }
  }

  await fileWriter.writeFile(props.filePath, props.content, {
    encoding: "utf-8",
  });
  const mtimeMs = await fileWriter.statMtimeMs(props.filePath);
  return { ok: true, mtimeMs };
}

/**
 * Deletes a file within the project
 */
export async function deleteFile(props: {
  folderPath: string;
  filePath: string;
}): Promise<boolean> {
  assertAbsoluteCleanPath(props.folderPath);
  const fileWriter = new FileWriter(props.folderPath);
  await fileWriter.deleteFile(props.filePath);
  return true;
}

/**
 * Recursively deletes a folder within the project
 */
export async function deleteFolder(props: {
  folderPath: string;
  folderRelativePath: string;
}): Promise<boolean> {
  assertAbsoluteCleanPath(props.folderPath);
  const fileWriter = new FileWriter(props.folderPath);
  await fileWriter.deleteFolder(props.folderRelativePath);
  return true;
}

/**
 * Moves a file or folder to a new location within the project
 */
export async function moveProjectNode(props: {
  folderPath: string;
  srcPath: string;
  destFolderPath: string;
}): Promise<{ newPath: string }> {
  assertAbsoluteCleanPath(props.folderPath);
  const fileWriter = new FileWriter(props.folderPath);
  const basename = path.basename(props.srcPath);
  const destPath = props.destFolderPath
    ? props.destFolderPath + "/" + basename
    : basename;
  await fileWriter.moveNode(props.srcPath, destPath);
  return { newPath: destPath };
}

/**
 * Copies a file or folder to a new location within the project. The renderer
 * supplies the full destination path (it computes the auto-renamed basename), so
 * unlike moveProjectNode the basename is not derived here.
 */
export async function copyProjectNode(props: {
  folderPath: string;
  srcPath: string;
  destPath: string;
}): Promise<{ newPath: string }> {
  assertAbsoluteCleanPath(props.folderPath);
  const fileWriter = new FileWriter(props.folderPath);
  await fileWriter.copyNode(props.srcPath, props.destPath);
  return { newPath: props.destPath };
}

/**
 * Renames a file or folder in place (within its current parent directory).
 * Rejects if a sibling with the new name already exists so an existing node is
 * never silently overwritten.
 */
export async function renameProjectNode(props: {
  folderPath: string;
  srcPath: string;
  newName: string;
}): Promise<{ newPath: string }> {
  assertAbsoluteCleanPath(props.folderPath);
  const fileWriter = new FileWriter(props.folderPath);
  const parent = path.dirname(props.srcPath);
  const destPath =
    parent && parent !== "." ? parent + "/" + props.newName : props.newName;
  if (destPath !== props.srcPath && (await fileWriter.exists(destPath))) {
    throw new Error(`"${props.newName}" already exists in this folder.`);
  }
  await fileWriter.moveNode(props.srcPath, destPath);
  return { newPath: destPath };
}

/**
 * Creates a new folder within a project
 * @param projectPath - Base project path
 * @param relativeFolderPath - Path relative to the project base where folder should be created
 * @returns Promise resolving to the full path of the created folder or empty string if failed
 */
export async function createFolder(
  projectPath: string,
  relativeFolderPath: string,
): Promise<string> {
  assertAbsoluteCleanPath(projectPath);
  const fileWriter = new FileWriter(projectPath);
  return await fileWriter.createFolder(relativeFolderPath);
}
