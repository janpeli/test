import { TreeController } from "@/components/ui/treeview/tree/controllers/tree-controller";
import { store } from "@/app/store";
import { setIdProjectNode } from "./active-context.slice";

export const MAIN_SIDEBAR_EXPLORER_TREE: { tree: TreeController | undefined } =
  { tree: undefined };

export function set_MAIN_SIDEBAR_EXPLORER_TREE(tree: TreeController) {
  MAIN_SIDEBAR_EXPLORER_TREE.tree = tree;
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
