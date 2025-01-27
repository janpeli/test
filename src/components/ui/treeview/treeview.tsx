import { ProjectStructure } from "electron/src/project";
import Tree from "./tree/tree";
import { IData } from "./tree/interfaces";
import React from "react";

type ProjectStructureData = ProjectStructure & IData;

type TreeviewProps = {
  projecStructure: ProjectStructureData;
};

function TreeviewComponent(props: TreeviewProps) {
  console.log("rendering treeview");
  return (
    <>
      <Tree data={props.projecStructure} />
    </>
  );
}

const Treeview = React.memo(TreeviewComponent);

Treeview.displayName = "Treeview";

export default Treeview;
