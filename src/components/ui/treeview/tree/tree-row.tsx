import { useEffect, useRef } from "react";
import { NodeController } from "./controllers/node-controller";
import TreeNode from "./tree-node";
import React from "react";
import { useNode } from "./hooks";
import NodeContextMenu from "../node-context-menu";
import TreeCursor from "./tree-cursor";

interface TreeRowProps {
  node: NodeController;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const TreeRow = React.memo(function TreeRowComponent(
  props: TreeRowProps
) {
  const node = useNode(props.node);

  const rowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function scrollIntoViewIfNeeded(
      row: HTMLDivElement,
      container: HTMLDivElement
    ) {
      const rowRect = row.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      const isRowBelowViewport = rowRect.bottom > containerRect.bottom;
      const isRowAboveViewport = rowRect.top < containerRect.top;

      if (isRowBelowViewport) {
        container.scrollTop =
          row.offsetTop + row.clientHeight - container.clientHeight;
      } else if (isRowAboveViewport) {
        container.scrollTop = row.offsetTop;
      }
    }

    if (node.isFocused && rowRef.current && props.containerRef.current) {
      rowRef.current.focus({ preventScroll: true });
      scrollIntoViewIfNeeded(rowRef.current, props.containerRef.current);
    }
  }, [node.isFocused, props.containerRef]);

  useEffect(() => {
    if (!node.isEdited && node.isFocused) {
      rowRef.current?.focus({ preventScroll: true });
    }
  }, [node.isEdited, node.isFocused]);

  const nodeStyle = { paddingLeft: 14 * node.level };

  const commands = node.getCommands();

  const dropTarget = node.tree.dropTarget;
  const isDropTarget = dropTarget?.node === node;
  const dropPosition = isDropTarget ? dropTarget.position : null;

  return (
    <NodeContextMenu commands={commands}>
      <div className="relative">
        {dropPosition === "before" && <TreeCursor position="top" />}
        <div
          className={`font-mono text-[12.5px] select-none outline-none hover:bg-sidebar-accent
          ${
            node.isSelected
              ? " bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_hsl(var(--primary))]"
              : ""
          }
          ${node.isDragged ? " opacity-50" : ""}
          ${node.isFocused ? " ring-1 ring-inset ring-ring" : ""}
          ${dropPosition === "into" ? " ring-1 ring-inset ring-primary" : ""}`}
          style={nodeStyle}
          onClick={(e) => node.handleClick(e)}
          onKeyDown={(e) => node.handleKeyDown(e)}
          onKeyUp={(e) => node.handleKeyUp(e)}
          draggable={node.tree.allowDragDrop}
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
          onFocus={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onDoubleClick={(e) => node.handleDblClick(e)}
        >
          <TreeNode node={node} />
        </div>
        {dropPosition === "after" && <TreeCursor position="bottom" />}
      </div>
    </NodeContextMenu>
  );
});

export default TreeRow;
