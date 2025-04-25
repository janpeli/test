import { TreeController } from "@/components/ui/treeview/tree/controllers/tree-controller";
import { store } from "@/app/store";
import { setIdProjectNode } from "./active-context.slice";
import { ProjectStructure } from "electron/src/project";

export const MAIN_SIDEBAR_EXPLORER_TREE: { tree: TreeController | undefined } =
  { tree: undefined };

export const MAIN_SIDEBAR_PLUGINS_TREE: { tree: TreeController | undefined } = {
  tree: undefined,
};

export function set_MAIN_SIDEBAR_EXPLORER_TREE(tree: TreeController) {
  MAIN_SIDEBAR_EXPLORER_TREE.tree = tree;
}

export function set_MAIN_SIDEBAR_PLUGINS_TREE(tree: TreeController) {
  MAIN_SIDEBAR_PLUGINS_TREE.tree = tree;
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
    console.log(MAIN_SIDEBAR_EXPLORER_TREE);
  }
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
    console.log(MAIN_SIDEBAR_PLUGINS_TREE);
  }
}
