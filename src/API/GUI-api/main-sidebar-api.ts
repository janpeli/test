import { TreeController } from "@/components/ui/treeview/tree/controllers/tree-controller";
import { store } from "@/app/store";
import { setIdProjectNode } from "./active-context.slice";
import { ProjectStructure } from "electron/src/project";
import { buildAIStructure } from "@/API/project-api/utils";

export const MAIN_SIDEBAR_EXPLORER_TREE: { tree: TreeController | undefined } =
  { tree: undefined };

export const MAIN_SIDEBAR_PLUGINS_TREE: { tree: TreeController | undefined } = {
  tree: undefined,
};

export const MAIN_SIDEBAR_AI_TREE: { tree: TreeController | undefined } = {
  tree: undefined,
};

export function set_MAIN_SIDEBAR_EXPLORER_TREE(tree: TreeController) {
  MAIN_SIDEBAR_EXPLORER_TREE.tree = tree;
}

export function set_MAIN_SIDEBAR_PLUGINS_TREE(tree: TreeController) {
  MAIN_SIDEBAR_PLUGINS_TREE.tree = tree;
}

export function set_MAIN_SIDEBAR_AI_TREE(tree: TreeController) {
  MAIN_SIDEBAR_AI_TREE.tree = tree;
  // Expand the synthetic project-root container so CLAUDE.md and .claude are
  // visible without a manual click.
  tree.openRootNode();
}

// Clears the clipboard on every clipboard-capable tree (Explorer + AI). A cut
// consumed by a menubar paste must empty the owning tree's clipboard too, not
// just the Redux mirror, so an in-tree Ctrl+V can't re-paste a stale cut.
export function clearAllTreeClipboards() {
  MAIN_SIDEBAR_EXPLORER_TREE.tree?.clearClipboard();
  MAIN_SIDEBAR_AI_TREE.tree?.clearClipboard();
}

export function explorerOnSelect(value: string | string[]) {
  let node: string;
  if (Array.isArray(value)) {
    node = value[0];
  } else {
    node = value;
  }

  store.dispatch(setIdProjectNode(node));
}

export function update_MAIN_SIDEBAR_EXPLORER_TREE() {
  const newProjectStructure = store.getState().projectAPI.projectStructure;
  if (
    MAIN_SIDEBAR_EXPLORER_TREE.tree &&
    newProjectStructure &&
    newProjectStructure.children
  ) {
    MAIN_SIDEBAR_EXPLORER_TREE.tree.updateTreeData(
      newProjectStructure.children.find(
        (child) => child.name === "models"
      ) as ProjectStructure
    );
  }
}

export function update_MAIN_SIDEBAR_AI_TREE() {
  const newProjectStructure = store.getState().projectAPI.projectStructure;
  const aiStructure = buildAIStructure(newProjectStructure);
  if (MAIN_SIDEBAR_AI_TREE.tree && aiStructure) {
    // The root is expanded once on mount (set_MAIN_SIDEBAR_AI_TREE) and stays
    // open across updates; don't re-open it here or we'd override the user
    // collapsing it whenever any file elsewhere in the project changes.
    MAIN_SIDEBAR_AI_TREE.tree.updateTreeData(aiStructure);
  }
}

/**
 * Refreshes every file tree that derives from the project structure (Explorer +
 * AI) after a structural change. The Plugins tree has its own reload path
 * (refreshPlugins) and is intentionally not driven from here.
 */
export function update_MAIN_SIDEBAR_TREES() {
  update_MAIN_SIDEBAR_EXPLORER_TREE();
  update_MAIN_SIDEBAR_AI_TREE();
}

export function update_MAIN_SIDEBAR_PLUGINS_TREE() {
  const newProjectStructure = store.getState().projectAPI.projectStructure;
  if (
    MAIN_SIDEBAR_PLUGINS_TREE.tree &&
    newProjectStructure &&
    newProjectStructure.children
  ) {
    MAIN_SIDEBAR_PLUGINS_TREE.tree.updateTreeData(
      newProjectStructure.children.find(
        (child) => child.name === "plugins"
      ) as ProjectStructure
    );
  }
}
