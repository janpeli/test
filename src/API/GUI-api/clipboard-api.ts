import { store } from "@/app/store";
import { NodeController } from "@/components/ui/treeview/tree/controllers/node-controller";
import { TreeController } from "@/components/ui/treeview/tree/controllers/tree-controller";
import {
  MAIN_SIDEBAR_EXPLORER_TREE,
  MAIN_SIDEBAR_AI_TREE,
} from "./main-sidebar-api";

// Bridges the menubar's Edit menu to the tree clipboard. Every action routes
// through the tree that owns the active node, reusing the exact per-tree
// clipboard logic as the context menu and Ctrl+C/X/V — so the menubar can't,
// for example, paste a clipboard captured in the Explorer into the AI panel.

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

export function menubarCopy() {
  const resolved = resolveActiveNode();
  if (resolved?.tree.onNodesCopy) resolved.tree.copyNodes(resolved.node);
}

export function menubarCut() {
  const resolved = resolveActiveNode();
  // Cut needs a relocation handler; only trees with onNodesMove (Explorer/AI)
  // can be cut from.
  if (resolved?.tree.onNodesMove) resolved.tree.cutNodes(resolved.node);
}

export function menubarPaste() {
  const resolved = resolveActiveNode();
  if (!resolved) return;
  // Paste only into the tree that actually holds the clipboard. An empty
  // clipboard on the active node's tree means the copy/cut happened in a
  // different panel (or was cleared) — do nothing rather than paste across
  // panels. tree.paste() handles target resolution, auto-rename and cut-clear.
  if (resolved.tree.clipboardIds.length === 0) return;
  void resolved.tree.paste(resolved.node);
}
