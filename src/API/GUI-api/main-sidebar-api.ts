import { TreeController } from "@/components/ui/treeview/tree/controllers/tree-controller";

export const MAIN_SIDEBAR_EXPLORER_TREE: { tree: TreeController | undefined } =
  { tree: undefined };

export function set_MAIN_SIDEBAR_EXPLORER_TREE(tree: TreeController) {
  MAIN_SIDEBAR_EXPLORER_TREE.tree = tree;
}
