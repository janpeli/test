import { ProjectStructure } from "electron/src/project";

import Tree from "./tree/tree";
import folderStructureData from "./tree/test-data/test-generator";

type TreeviewProps = {
  projecStructure: ProjectStructure;
};

export default function Treeview(props: TreeviewProps) {
  return (
    <>
      <Tree data={folderStructureData} />
    </>
  );
}
