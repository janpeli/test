import { useEffect, useRef } from "react";
import { NodeController } from "./controllers/node-controller";
import TreeNode from "./tree-node";
import React from "react";
import { useNode } from "./hooks";

interface TreeRowProps {
  node: NodeController;
}

export const TreeRow = React.memo(function TreeRowComponent(
  props: TreeRowProps
) {
  const node = useNode(props.node);
  //console.log(`tree row node: ${node.data.name} is rendering`);

  const rowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!node.isEdited && node.isFocused) {
      rowRef.current?.focus({ preventScroll: true });
    }
  }, [node.isEdited, node.isFocused]);

  const nodeStyle = { paddingLeft: 14 * node.level };

  return (
    <div
      className={`
      select-none outline-none
      ${node.isSelected ? "bg-blue-100 dark:bg-blue-800" : ""}
      ${node.isDragged ? "opacity-50" : ""}
      ${node.isFocused ? "ring-1 ring-blue-400" : ""}
    `}
      style={nodeStyle}
      onClick={(e) => node.handleClick(e)}
      onKeyDown={(e) => node.handleKeyDown(e)}
      onKeyUp={(e) => node.handleKeyUp(e)}
      draggable
      onDragStart={(e) => node.handleDragStart(e)}
      onDragOver={(e) => node.handleDragOver(e)}
      onDragEnter={(e) => node.handleDragEnter(e)}
      onDragLeave={(e) => node.handleDragLeave(e)}
      onDrop={(e) => node.handleDrop(e)}
      onDragEnd={(e) => node.handleDragEnd(e)}
      role="treeitem"
      aria-expanded={node.isOpen}
      aria-selected={node.isSelected}
      aria-level={node.level + 1}
      tabIndex={node.isFocused ? 0 : -1}
      ref={rowRef}
      onFocus={(e) => e.stopPropagation()}
    >
      <TreeNode node={node} />
    </div>
  );
});

export default TreeRow;
