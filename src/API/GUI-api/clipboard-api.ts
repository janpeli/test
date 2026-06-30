import { store } from "@/app/store";
import { ProjectStructure } from "electron/src/project";
import { findProjectStructureById } from "../project-api/utils";
import { copyProjectNodes, moveProjectNode } from "../project-api/project-api";
import { retargetPasteFolder } from "@/lib/copy/paste-target.core";
import { NodeController } from "@/components/ui/treeview/tree/controllers/node-controller";
import { TreeController } from "@/components/ui/treeview/tree/controllers/tree-controller";
import {
  MAIN_SIDEBAR_EXPLORER_TREE,
  MAIN_SIDEBAR_AI_TREE,
  clearAllTreeClipboards,
} from "./main-sidebar-api";

// Bridges the menubar's Edit menu to the tree clipboard. Copy/Cut route through
// whichever tree owns the active node so the full multi-selection is captured
// (and the Redux mirror is updated via the tree's onClipboardChange). Paste is
// driven by the global Redux mirror instead — it is the most recent clipboard
// action regardless of which tree is currently focused — and calls the same
// id-based copy/move functions used by drag-drop and Ctrl+V.

/**
 * Resolves the active project node (`activeContext.idProjectNode`) to the
 * clipboard-capable tree that contains it. The id is shared by the Explorer and
 * AI panels, so both are searched; their id namespaces don't overlap.
 */
function resolveActiveNode():
  | { tree: TreeController; node: NodeController }
  | undefined {
  const id = store.getState().activeContext.idProjectNode;
  if (!id) return undefined;
  for (const ref of [MAIN_SIDEBAR_EXPLORER_TREE, MAIN_SIDEBAR_AI_TREE]) {
    const node = ref.tree?.getNodeById(id);
    if (ref.tree && node) return { tree: ref.tree, node };
  }
  return undefined;
}

/**
 * Folder a paste should target given the active node: the node itself when it's
 * a folder, otherwise its parent folder ("" at the project root). Resolved
 * against the full project structure so it works for both the Explorer and AI
 * trees.
 */
function pasteTargetFolderId(activeId: string | undefined): string {
  const structure: ProjectStructure | null =
    store.getState().projectAPI.projectStructure;
  if (!activeId || !structure) return "";
  const node = findProjectStructureById(structure, activeId);
  if (!node) return "";
  if (!node.isLeaf) return activeId;
  return activeId.split("/").slice(0, -1).join("/");
}

export function menubarCopy() {
  const resolved = resolveActiveNode();
  resolved?.tree.copyNodes(resolved.node);
}

export function menubarCut() {
  const resolved = resolveActiveNode();
  // Cut needs a relocation handler; only trees with onNodesMove (Explorer/AI)
  // can be cut from. resolveActiveNode already scopes to those trees.
  if (resolved?.tree.onNodesMove) resolved.tree.cutNodes(resolved.node);
}

export async function menubarPaste() {
  const { ids, mode } = store.getState().clipboard;
  if (ids.length === 0 || !mode) return;

  const activeId = store.getState().activeContext.idProjectNode;
  const target = retargetPasteFolder(pasteTargetFolderId(activeId), ids);

  if (mode === "cut") {
    const moved = await moveProjectNode(ids, target);
    // A cut is consumed on a confirmed move: clear every tree's clipboard (which
    // also clears the mirror via onClipboardChange). A rejected move keeps it.
    if (moved) clearAllTreeClipboards();
  } else {
    copyProjectNodes(ids, target);
  }
}
