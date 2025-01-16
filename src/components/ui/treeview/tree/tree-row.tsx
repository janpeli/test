import { useEffect, useRef } from "react";
import { NodeController } from "./controllers/node-controller";
import TreeNode from "./tree-node";
import React from "react";
import { useNode } from "./hooks";
//import { useAppDispatch } from "@/hooks/hooks";
import NodeContextMenu, { NodeAction } from "../node-context-menu";
import {
  openFileById,
  openFileByIdInOtherView,
} from "@/API/editor-api/editor-api";

interface TreeRowProps {
  node: NodeController;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const TreeRow = React.memo(function TreeRowComponent(
  props: TreeRowProps
) {
  const node = useNode(props.node);
  //console.log(`tree row node: ${node.data.name} is rendering`);

  const rowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function scrollIntoViewIfNeeded(
      row: HTMLDivElement,
      container: HTMLDivElement
    ) {
      const rowRect = row.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      //console.log(rowRect, containerRect);

      // Check if the row is partially or fully outside the visible area
      const isRowBelowViewport = rowRect.bottom > containerRect.bottom;
      const isRowAboveViewport = rowRect.top < containerRect.top;

      if (isRowBelowViewport) {
        // If row is below viewport, align its bottom with container's bottom
        container.scrollTop =
          row.offsetTop + row.clientHeight - container.clientHeight;
      } else if (isRowAboveViewport) {
        // If row is above viewport, align its top with container's top
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

  //const dispatch = useAppDispatch();

  const actions: NodeAction[] = [
    // { actionName: "Edit name", actionFunction: () => node.edit() },
    // { actionName: "Delete", actionFunction: () => tree.delete(node.id) },
    {
      actionName: "Open",
      actionFunction: () => openFileById(node.data.id, node.data.name),
    },
    {
      actionName: "Open In Other View",
      actionFunction: () =>
        openFileByIdInOtherView(node.data.id, node.data.name),
    },
  ];

  const nodeStyle = { paddingLeft: 14 * node.level };

  //bg-blue-800
  return (
    <NodeContextMenu actions={actions}>
      <div
        className={` my-[0.5px] select-none outline-none hover:bg-accent hover:text-accent-foreground
      ${node.isSelected ? " bg-accent text-accent-foreground" : ""}
      ${node.isDragged ? " opacity-50" : ""}
      ${node.isFocused ? " ring-1 ring-blue-400" : ""}`}
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
        onFocus={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onDoubleClick={() => openFileById(node.data.id, node.data.name)}
      >
        <TreeNode node={node} />
      </div>
    </NodeContextMenu>
  );
});

export default TreeRow;
