import { ProjectStructure } from "electron/src/project";

import Tree from "./tree/tree";
//import folderStructureData from "./tree/test-data/test-generator";
import { IData } from "./tree/interfaces";

type ProjectStructureData = ProjectStructure & IData;

type TreeviewProps = {
  projecStructure: ProjectStructureData;
  height: number;
};

export default function Treeview(props: TreeviewProps) {
  return (
    <>
      <Tree data={props.projecStructure} height={props.height} />
    </>
  );
}
