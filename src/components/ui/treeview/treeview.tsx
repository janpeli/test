import { ProjectStructure } from "electron/src/project";
import Tree from "./tree/tree";
import { IData } from "./tree/interfaces";

type ProjectStructureData = ProjectStructure & IData;

type TreeviewProps = {
  projecStructure: ProjectStructureData;
};

export default function Treeview(props: TreeviewProps) {
  return (
    <>
      <Tree data={props.projecStructure} />
    </>
  );
}
