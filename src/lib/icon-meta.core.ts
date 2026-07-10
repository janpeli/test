/**
 * Pure helpers (type-only imports, no app/electron runtime) for resolving the
 * icon-relevant fields of a file from the loaded ProjectStructure. Shared by
 * panels that render FileIcon rows for paths that may or may not correspond to
 * a loaded structure node (search results, git changes) — those lists reflect
 * the live disk while the structure is a project-open snapshot, so a node may
 * be missing and callers fall back to the filename extension.
 */

import type { ProjectStructure } from "electron/src/project";

/** Icon-relevant fields resolved from the ProjectStructure node for a file. */
export type IconMeta = { sufix: string; plugin_uuid: string | null };

/** Flattens the structure into an id → icon-meta map (one walk, not per file). */
export function buildIconMetaMap(
  structure: ProjectStructure | null
): Map<string, IconMeta> {
  const map = new Map<string, IconMeta>();
  const walk = (node: ProjectStructure) => {
    if (node.isLeaf) {
      map.set(node.id, { sufix: node.sufix, plugin_uuid: node.plugin_uuid });
    }
    node.children?.forEach(walk);
  };
  if (structure) walk(structure);
  return map;
}

/** Extension of a filename ("" when none), used as the icon fallback sufix. */
export function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1) : "";
}
