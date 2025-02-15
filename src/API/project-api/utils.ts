import { ProjectStructure } from "electron/src/project";
import path from "path-browserify";

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
 * Extracts the folder path from a given file path
 * @param path - The full file path
 * @returns The folder path without the file name
 */
export function getFolderFromPath(ipath: string): string {
  const path_posix = ipath.replace(/\\/g, "/");
  const dirname = path.dirname(path_posix).replace(/\//g, "\\");
  return dirname;
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
