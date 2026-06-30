import { useMemo, useState } from "react";
import { IData } from "./interfaces";
import { TreeController } from "./controllers/tree-controller";
import { NodeController } from "./controllers/node-controller";
import { Commands } from "@/API";

export function useNode(node: NodeController) {
  const [renders, setRenders] = useState<number>(0);
  return node.addRenderer(setRenders, renders);
}

export function useTree(
  data: IData,
  onSelect?: (value: string | string[]) => void,
  nodeContextCommands?: (node: NodeController) => Commands,
  onDblClick?: (node: NodeController) => void,
  allowDragDrop?: boolean,
  onNodesMove?: (
    draggedIds: string[],
    targetFolderId: string
  ) => void | Promise<boolean>,
  onNodesCopy?: (sourceIds: string[], targetFolderId: string) => void,
  onClipboardChange?: (ids: string[], mode: "copy" | "cut" | null) => void,
  getNodeIcon?: (node: NodeController) => React.ReactNode
) {
  const [renders, setRenders] = useState<number>(0);
  const tree = useMemo(() => {
    const treeControler = new TreeController(data, renders, setRenders);
    treeControler.onSelect = onSelect;
    treeControler.nodeContextCommands = nodeContextCommands;
    treeControler.onDblClick = onDblClick;
    treeControler.allowDragDrop = allowDragDrop ?? false;
    treeControler.onNodesMove = onNodesMove;
    treeControler.onNodesCopy = onNodesCopy;
    treeControler.onClipboardChange = onClipboardChange;
    treeControler.getNodeIcon = getNodeIcon;
    return treeControler;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return tree;
}
