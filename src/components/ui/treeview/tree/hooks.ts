import { useMemo, useState } from "react";
import { IData } from "./interfaces";
import { TreeController } from "./controllers/tree-controller";
import { NodeController } from "./controllers/node-controller";

export function useNode(node: NodeController) {
  const [renders, setRenders] = useState<number>(0);
  return node.addRenderer(setRenders, renders);
}

export function useTree(
  data: IData,
  onSelect?: (value: string | string[]) => void
) {
  const [renders, setRenders] = useState<number>(0);
  const tree = useMemo(() => {
    const treeControler = new TreeController(data, renders, setRenders);
    treeControler.onSelect = onSelect;
    return treeControler;
  }, []);
  return tree;
}
