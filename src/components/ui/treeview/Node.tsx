import {
  File,
  Folder,
  ChevronDown,
  ChevronRight,
  Pencil,
  X,
} from "lucide-react";
import { Input } from "../input";

export const Node = ({ node, style, dragHandle, tree }) => {
  const CustomIcon = node.data.icon;
  const iconColor = node.data.iconColor;

  // console.log(node, tree);
  return (
    <div
      className={`group node-container flex items-center h-full w-full ${
        node.state.isSelected ? "isSelected" : ""
      }`}
      style={style}
      ref={dragHandle}
    >
      <div
        className="node-content flex items-center h-full w-full"
        onClick={() => node.isInternal && node.toggle()}
      >
        {node.isLeaf ? (
          <>
            <span className="arrow w-3 text-xl flex"></span>
            <span className="file-folder-icon mr-2 flex items-center text-xl">
              {CustomIcon ? (
                <CustomIcon color={iconColor ? iconColor : "#6bc7f6"} />
              ) : (
                <File className="text-secondary" />
              )}
            </span>
          </>
        ) : (
          <>
            <span className="arrow">
              {node.isOpen ? <ChevronDown /> : <ChevronRight />}
            </span>
            <span className="file-folder-icon mr-2 flex items-center text-xl">
              {CustomIcon ? (
                <CustomIcon color={iconColor ? iconColor : "#f6cf60"} />
              ) : (
                <Folder />
              )}
            </span>
          </>
        )}
        <span className="node-text flex-1">
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
            />
          ) : (
            <span className="truncate">{node.data.name}</span>
          )}
        </span>
      </div>

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
};
