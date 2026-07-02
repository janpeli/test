import { useEffect, useRef } from "react";
import { RowComponentProps } from "react-window";
import { TreeController } from "./controllers/tree-controller";
import TreeNode from "./tree-node";
import { useNode } from "./hooks";
import NodeContextMenu from "../node-context-menu";
import TreeCursor from "./tree-cursor";

type TreeRowProps = {
  tree: TreeController;
  /** Bumped on every tree-level render so react-window's memo re-renders
   * mounted rows (rows are index-keyed; the node at an index can change). */
  epoch: number;
};

export function TreeRow({
  index,
  style,
  ariaAttributes,
  tree,
}: RowComponentProps<TreeRowProps>) {
  const node = useNode(tree.visibleNodes[index]);

  const rowRef = useRef<HTMLDivElement | null>(null);

  // Runs when the row mounts already-focused (scrolled into range by the
  // container's scrollToRow) or when focus moves to an already-mounted row.
  useEffect(() => {
    if (!node.isEdited && node.isFocused) {
      rowRef.current?.focus({ preventScroll: true });
    }
  }, [node, node.isEdited, node.isFocused]);

  const nodeStyle = { paddingLeft: 14 * node.level };

  const commands = node.getCommands();

  const dropTarget = node.tree.dropTarget;
  const isDropTarget = dropTarget?.node === node;
  const dropPosition = isDropTarget ? dropTarget.position : null;

  return (
    <NodeContextMenu commands={commands}>
      {/* react-window's absolute positioning makes this the containing block
          for TreeCursor (was className="relative" pre-virtualization). */}
      <div style={style} role="presentation">
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
          {...ariaAttributes}
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
}

export default TreeRow;
