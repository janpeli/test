import { ProjectStructure } from "electron/src/project";

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
