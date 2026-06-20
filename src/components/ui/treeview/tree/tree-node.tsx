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
  const nodeIcon = node.tree.getNodeIcon?.(node);
  const Icon = () =>
    nodeIcon != null ? (
      <>{nodeIcon}</>
    ) : node.data.isLeaf ? (
      <File className="w-4 h-4 text-icon-faint pointer-events-none" />
    ) : node.isOpen ? (
      <Folder className="w-4 h-4 text-icon-faint pointer-events-none" />
    ) : (
      <FolderClosed className="w-4 h-4 text-icon-faint pointer-events-none" />
    );
  return (
    <div className="flex flex-row items-center gap-1.5 h-6 min-w-0 pr-2">
      {!node.data.isLeaf ? (
        node.isOpen ? (
          <ChevronDown className="w-4 h-4 shrink-0 text-faint pointer-events-none" />
        ) : (
          <ChevronRight className="w-4 h-4 shrink-0 text-faint pointer-events-none" />
        )
      ) : (
        <div className="w-4 h-4 shrink-0" />
      )}
      <span className="flex shrink-0 items-center">
        <Icon />
      </span>
      <span
        className={`truncate ${
          !node.data.isLeaf && !node.isSelected ? "text-faint" : ""
        }`}
      >
        {node.data.name}
      </span>
    </div>
  );
}

export default TreeNode;
