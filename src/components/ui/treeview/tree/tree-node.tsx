import { NodeController } from "./controllers/node-controller";
import {
  Folder,
  FolderClosed,
  File,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface TreeNodeProps {
  node: NodeController;
}

function TreeNode({ node }: TreeNodeProps) {
  //console.log(`node is rendering: ${node.data.name} : ${node.renders} `);
  const Icon = () =>
    node.data.isLeaf ? (
      <File className="w-4 h-4" />
    ) : node.isOpen ? (
      <Folder className="w-4 h-4" />
    ) : (
      <FolderClosed className="w-4 h-4" />
    );
  return (
    <div className="flex flex-row items-center gap-1">
      {!node.data.isLeaf ? (
        node.isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )
      ) : (
        <div className="w-4 h-4" />
      )}
      <Icon />
      {node.data.name}
    </div>
  );
}

export default TreeNode;
