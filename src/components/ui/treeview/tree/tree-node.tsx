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
      <File className="w-4 h-4 text-base pointer-events-none" />
    ) : node.isOpen ? (
      <Folder className="w-4 h-4 text-base pointer-events-none" />
    ) : (
      <FolderClosed className="w-4 h-4 text-base pointer-events-none" />
    );
  return (
    <div className="flex flex-row items-center gap-1">
      {!node.data.isLeaf ? (
        node.isOpen ? (
          <ChevronDown className="w-4 h-4 text-base pointer-events-none" />
        ) : (
          <ChevronRight className="w-4 h-4 text-base pointer-events-none" />
        )
      ) : (
        <div className="w-4 h-4" />
      )}
      <Icon />
      <span className="truncate">{node.data.name}</span>
    </div>
  );
}

export default TreeNode;
