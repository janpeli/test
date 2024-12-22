import { useMemo, useState } from "react";
import { IData } from "./interfaces";
import { TreeController } from "./controllers/tree-controller";
import { NodeController } from "./controllers/node-controller";

export function useNode(node: NodeController) {
  const [renders, setRenders] = useState<number>(0);
  return node.addRenderer(setRenders, renders);
}

export function useTree(data: IData) {
  const [renders, setRenders] = useState<number>(0);
  const tree = useMemo(() => {
    return new TreeController(data, renders, setRenders);
  }, []);
  return tree;
}
