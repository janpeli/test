import { Plugin, ProjectStructure } from "electron/src/project";
import path from "path-browserify";

/**
 * True when a file/folder id lives inside the project's plugins/ directory
 * (i.e. it is a plugin definition file rather than a model data object).
 */
export function isPluginFileId(id: string): boolean {
  return id.startsWith("plugins/");
}

/**
 * Returns the relative plugin-root path for a file/folder id inside plugins/
 * (e.g. "plugins/Oracle-Physical-Data-Model"). Returns null when the id is not
 * inside a specific plugin — i.e. it is outside plugins/, or it is the
 * "plugins" root itself (which belongs to no single plugin).
 */
export function getPluginRoot(id: string): string | null {
  if (!isPluginFileId(id)) return null;
  const parts = id.split("/");
  if (parts.length < 2) return null;
  return parts[0] + "/" + parts[1];
}

/**
 * Builds the AI panel root: the project root rendered with only its AI-related
 * entries — CLAUDE.md and the `.claude/` folder — as children, hiding models,
 * plugins, and project.yaml. Returns a shallow copy of the project-root node (it
 * never mutates store state), or null when the project has no such entries yet.
 *
 * Used by both the initial selector and the imperative tree updater so they stay
 * in sync. The synthetic root carries an empty id (`""`) — the project-root
 * relative path — so top-level children's parent paths line up with it; a drop
 * or paste onto this root resolves to the project folder (see
 * resolveTargetFolder in project-api), and the AI panel suppresses file
 * operations on this root node directly. The `.claude` folder's display name is
 * restored here because the recursive reader strips leading-dot stems to "".
 */
export function buildAIStructure(
  projectStructure: ProjectStructure | null | undefined
): ProjectStructure | null {
  if (!projectStructure?.children) return null;

  const aiChildren = projectStructure.children
    .filter(
      (child) =>
        (child.isLeaf &&
          child.name.toUpperCase() === "CLAUDE" &&
          child.sufix.toLowerCase() === "md") ||
        (!child.isLeaf && child.id === ".claude")
    )
    .map((child) =>
      child.id === ".claude" ? { ...child, name: ".claude" } : child
    );

  if (aiChildren.length === 0) return null;

  return { ...projectStructure, id: "", children: aiChildren };
}

/**
 * Finds a child in the project structure tree by its ID.
 *
 * @param {ProjectStructure} structure The project structure tree to search within.
 * @param {string} targetId The ID of the node to find.
 * @returns {ProjectStructure} Returns the project structure with given id.
 */
export function findProjectStructureById(
  structure: ProjectStructure,
  targetId: string
): ProjectStructure | null {
  // If current node matches the target ID, return it
  if (structure.id === targetId) {
    return structure;
  }
  // If current node has no children or isn't a folder, return null
  if (!structure.children || !structure.isFolder) {
    return null;
  }
  // Search through children
  for (const child of structure.children) {
    const result = findProjectStructureById(child, targetId);
    if (result) {
      return result;
    }
  }
  return null;
}

/**
 * Traverses the project structure tree and validates if a given UUID exists
 * @param structure - The project structure tree to search within
 * @param targetUuid - The UUID to search for
 * @returns boolean indicating if the UUID exists in the project structure
 */
export function validateUuidInProjectStructure(
  structure: ProjectStructure,
  targetUuid: string
): boolean {
  // Check if current node has the target UUID
  if (structure.plugin_uuid === targetUuid) {
    return true;
  }

  // If current node has children, search through them
  if (structure.children && structure.children.length > 0) {
    for (const child of structure.children) {
      const found = validateUuidInProjectStructure(child, targetUuid);
      if (found) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Finds all project structure nodes that use a specific UUID
 * @param structure - The project structure tree to search within
 * @param targetUuid - The UUID to search for
 * @returns Array of ProjectStructure nodes that use the given UUID
 */
export function findNodesByUuid(
  structure: ProjectStructure,
  targetUuid: string
): ProjectStructure[] {
  const results: ProjectStructure[] = [];

  // Check if current node has the target UUID
  if (structure.plugin_uuid === targetUuid) {
    results.push(structure);
  }

  // If current node has children, search through them
  if (structure.children && structure.children.length > 0) {
    for (const child of structure.children) {
      const childResults = findNodesByUuid(child, targetUuid);
      results.push(...childResults);
    }
  }

  return results;
}

/**
 * Gets all unique UUIDs used in the project structure
 * @param structure - The project structure tree to traverse
 * @returns Set of unique UUIDs found in the project structure
 */
export function getAllUuidsFromProjectStructure(
  structure: ProjectStructure
): Set<string> {
  const uuids = new Set<string>();

  // Add current node's UUID if it exists
  if (structure.plugin_uuid) {
    uuids.add(structure.plugin_uuid);
  }

  // If current node has children, get UUIDs from them
  if (structure.children && structure.children.length > 0) {
    for (const child of structure.children) {
      const childUuids = getAllUuidsFromProjectStructure(child);
      childUuids.forEach((uuid) => uuids.add(uuid));
    }
  }

  return uuids;
}

/**
 * Validates that all UUIDs in the project structure exist in the provided plugins array
 * @param structure - The project structure tree to validate
 * @param plugins - Array of available plugins
 * @returns Object containing validation results and details
 */
export function validateAllUuidsInProjectStructure(
  structure: ProjectStructure,
  plugins: Plugin[]
): {
  isValid: boolean;
  missingUuids: string[];
  validUuids: string[];
  orphanedNodes: ProjectStructure[];
} {
  const allUuids = getAllUuidsFromProjectStructure(structure);
  const pluginUuids = new Set(plugins.map((plugin) => plugin.uuid));

  const missingUuids: string[] = [];
  const validUuids: string[] = [];
  const orphanedNodes: ProjectStructure[] = [];

  // Check each UUID found in the project structure
  allUuids.forEach((uuid) => {
    if (pluginUuids.has(uuid)) {
      validUuids.push(uuid);
    } else {
      missingUuids.push(uuid);
      // Find all nodes that use this missing UUID
      const nodesWithMissingUuid = findNodesByUuid(structure, uuid);
      orphanedNodes.push(...nodesWithMissingUuid);
    }
  });

  return {
    isValid: missingUuids.length === 0,
    missingUuids,
    validUuids,
    orphanedNodes,
  };
}

/**
 * Extracts the folder path from a given file path
 * @param path - The full file path
 * @returns The folder path without the file name
 */
export function getFolderFromPath(ipath: string): string {
  return path.dirname(ipath.replace(/\\/g, "/"));
}

/**
 * Normalizes text to create a valid filename across Windows, Linux, and macOS
 * @param text - The text to normalize into a filename
 * @param options - Configuration options for normalization
 * @returns A normalized filename string
 */
interface NormalizeOptions {
  replacement?: string; // Character to replace invalid chars with
  lowercase?: boolean; // Convert to lowercase
  maxLength?: number; // Maximum filename length
  trimWhitespace?: boolean; // Trim whitespace from start/end
}

export function normalizeFilename(
  text: string,
  options: NormalizeOptions = {}
): string {
  const {
    replacement = "-",
    lowercase = true,
    maxLength = 255,
    trimWhitespace = true,
  } = options;

  if (!text) return "";

  let filename = text;

  // Convert to lowercase if specified
  if (lowercase) {
    filename = filename.toLowerCase();
  }

  filename = filename
    // Replace invalid characters with the replacement character
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, replacement)
    // Replace control characters
    .replace(/[\x7F\x80-\x9F]/g, replacement)
    // Replace spaces with replacement character
    .replace(/\s+/g, replacement)
    // Replace dots at the start
    .replace(/^\.+/, replacement)
    // Replace multiple consecutive replacement characters with a single one
    .replace(new RegExp(`\\${replacement}+`, "g"), replacement)
    // Remove replacement character from the end
    .replace(new RegExp(`\\${replacement}$`), "");

  // Trim whitespace if specified
  if (trimWhitespace) {
    filename = filename.trim();
  }

  // Handle Windows reserved names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
  const reservedNames = /^(con|prn|aux|nul|com\d|lpt\d)$/i;
  if (reservedNames.test(filename)) {
    filename = `_${filename}`;
  }

  // Ensure filename isn't empty after processing
  if (!filename) {
    filename = "untitled";
  }

  // Truncate to max length while preserving extension
  if (filename.length > maxLength) {
    const ext = filename.lastIndexOf(".");
    if (ext > -1) {
      const extension = filename.slice(ext);
      const name = filename.slice(0, ext);
      filename = name.slice(0, maxLength - extension.length) + extension;
    } else {
      filename = filename.slice(0, maxLength);
    }
  }

  return filename;
}

export const getPluginforFileID = (
  id: string,
  projectStructure: ProjectStructure,
  plugins: Plugin[]
) => {
  const UUID = findProjectStructureById(projectStructure, id)
    ?.plugin_uuid as string;
  const plugin = plugins.find((plugin) => plugin.uuid === UUID);
  return plugin;
};
