import {
  File,
  Folder,
  ChevronDown,
  ChevronRight,
  Pencil,
  X,
} from "lucide-react";
import { Input } from "../input";
import { NodeRendererProps } from "react-arborist";
import { ProjectStructure } from "electron/src/project";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../context-menu";

export function Node({
  style,
  node,
  tree,
  dragHandle,
}: NodeRendererProps<ProjectStructure>) {
  // console.log(node, tree);

  const Arrow = (
    <>
      {node.isLeaf ? (
        <span className="arrow w-4"></span>
      ) : (
        <span className="arrow">
          {node.isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </span>
      )}
    </>
  );

  const NodeIcon = (
    <span className="file-folder-icon mr-2 flex items-center text-xl">
      {node.isLeaf ? (
        <File className="w-4 h-4" />
      ) : (
        <Folder className="w-4 h-4" />
      )}
    </span>
  );

  const NodeText = (
    <div className="node-text flex-1 text-sm">
      {node.isEditing ? (
        <Input
          type="text"
          defaultValue={node.data.name}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={() => node.reset()}
          onKeyDown={(e) => {
            if (e.key === "Escape") node.reset();
            if (e.key === "Enter") node.submit(e.currentTarget.value);
          }}
          autoFocus
          className="h-5"
        />
      ) : (
        <span className="truncate">{node.data.name}</span>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "group node-container flex items-center h-full w-full hover:bg-accent hover:text-accent-foreground",
        node.isSelected ? "bg-accent text-accent-foreground" : ""
      )}
      style={style}
      ref={dragHandle}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div //node content
            className="node-content flex items-center h-full w-full"
            onClick={() => node.isInternal && node.toggle()}
          >
            {Arrow}
            {NodeIcon}
            {NodeText}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => node.edit()}>
            Edit name
          </ContextMenuItem>
          <ContextMenuItem onClick={() => tree.delete(node.id)}>
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <div className="file-actions h-full hidden group-hover:flex">
        <div className="folderFileActions flex flex-row items-center mr-2">
          <button
            className="flex items-center text-base h-full w-5"
            onClick={() => node.edit()}
            title="Rename..."
          >
            <Pencil />
          </button>
          <button
            className="flex items-center text-base h-full w-5"
            onClick={() => tree.delete(node.id)}
            title="Delete"
          >
            <X />
          </button>
        </div>
      </div>
    </div>
  );
}
