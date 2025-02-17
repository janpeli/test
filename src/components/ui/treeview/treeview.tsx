import { ProjectStructure } from "electron/src/project";
import Tree from "./tree/tree";
import { IData } from "./tree/interfaces";
import React from "react";
import { Commands } from "@/API";
import { NodeController } from "./tree/controllers/node-controller";
import { TreeController } from "./tree/controllers/tree-controller";

type ProjectStructureData = ProjectStructure & IData;

type TreeviewProps = {
  projecStructure: ProjectStructureData;
  onSelect?: (value: string | string[]) => void;
  defaultValue?: string | string[];
  allowMultiselect?: boolean;
  nodeContextCommands?: (node: NodeController) => Commands;
  onDblClick?: (node: NodeController) => void;
  treeCallBack?: (node: TreeController) => void;
};

function TreeviewComponent(props: TreeviewProps) {
  console.log("rendering treeview");
  return (
    <>
      <Tree data={props.projecStructure} {...props} />
    </>
  );
}

const Treeview = React.memo(TreeviewComponent);

Treeview.displayName = "Treeview";

export default Treeview;
