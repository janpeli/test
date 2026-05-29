import { MouseEventHandler } from "react";
import { INode, IData } from "../interfaces";
import { TreeController } from "./tree-controller";

export class NodeController implements INode {
  data: IData;
  parent: NodeController | null;
  level: number;
  tree: TreeController;
  children?: NodeController[] | undefined;
  renders: number | undefined;
  private setRenders?: React.Dispatch<React.SetStateAction<number>>;

  isOpen: boolean;
  isSelected: boolean = false;
  isFocused: boolean = false;
  isDragged: boolean = false;
  isEdited: boolean = false;

  constructor(
    data: IData,
    parent: NodeController | null,
    tree: TreeController,
    level: number
  ) {
    this.data = data;
    this.isOpen = false;
    this.parent = parent;
    this.level = level;
    this.tree = tree;
  }

  addRenderer(
    setRenders: React.Dispatch<React.SetStateAction<number>>,
    renders: number
  ): NodeController {
    this.setRenders = setRenders;
    this.renders = renders;
    return this;
  }

  toggleOpen() {
    this.tree.toggleNodeOpen(this);
  }

  expand() {
    this.tree.expandNode(this);
  }

  update() {
    if (this.setRenders && typeof this.renders === "number") {
      this.setRenders(++this.renders);
    }
  }

  getCommands() {
    const nodeContextCommands = this.tree.nodeContextCommands;
    if (nodeContextCommands) return nodeContextCommands(this);
    return [];
  }

  handleDblClick: MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    if (!this.tree.onDblClick) return;
    this.tree.onDblClick(this);
  };

  handleClick: MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      this.tree.toggleSelectedNode(this);
      this.tree.addFocusedNode(this);
      return;
    }
    if (e.shiftKey) {
      /*if (this.tree.multiselectNodes) {
        this.tree.removeSelectedNodes(this.tree.multiselectNodes);
      }

      if (!this.tree.multiselectAnchorNode)
        this.tree.multiselectAnchorNode = this.tree.focusedNode
          ? this.tree.focusedNode
          : this.tree.rootNode;

      const indexClicked = this.tree.visibleNodes.indexOf(this);
      const indexAnchored = this.tree.visibleNodes.indexOf(
        this.tree.multiselectAnchorNode
      );

      const newMultiSelectedNodes: NodeController[] =
        indexClicked >= indexAnchored
          ? this.tree.visibleNodes.slice(indexAnchored, indexClicked + 1)
          : this.tree.visibleNodes.slice(indexClicked, indexAnchored + 1);

      this.tree.addSelectedNodes(newMultiSelectedNodes);
      this.tree.multiselectNodes = newMultiSelectedNodes;
      this.tree.addFocusedNode(this);*/
      //console.log(this.tree.multiselectNodes);
      this.tree.calculateMultiselectNodes(this);
      return;
    }

    this.tree.clearSelectedNodes();
    this.tree.addSelectedNodes(this);
    this.tree.addFocusedNode(this);
    this.toggleOpen();
  };

  handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    //console.log(`Stlacil si ${e.key}`);

    if (this.tree.isEditing) {
      return;
    }
    /*if (e.key === "Backspace") {
        if (!tree.props.onDelete) return;
        const ids = Array.from(tree.selectedIds);
        if (ids.length > 1) {
          let nextFocus = tree.mostRecentNode;
          while (nextFocus && nextFocus.isSelected) {
            nextFocus = nextFocus.nextSibling;
          }
          if (!nextFocus) nextFocus = tree.lastNode;
          tree.focus(nextFocus, { scroll: false });
          tree.delete(Array.from(ids));
        } else {
          const node = tree.focusedNode;
          if (node) {
            const sib = node.nextSibling;
            const parent = node.parent;
            tree.focus(sib || parent, { scroll: false });
            tree.delete(node);
          }
        }
        return;
      }*/
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      this.tree.focusNext();
      return;
    }

    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      this.tree.focusPrevious();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();

      if (e.metaKey || e.ctrlKey) {
        if (this.tree.focusedNode) {
          this.tree.addSelectedNodes(this.tree.focusedNode);
        }
        return;
      } else if (e.shiftKey) {
        if (this.tree.focusedNode) {
          //this.tree.focusNext();
          //this.tree.toggleSelectedNode(this.tree.focusedNode);
          if (!this.tree.multiselectAnchorNode)
            this.tree.multiselectAnchorNode = this;
          this.tree.focusNext();
          this.tree.calculateMultiselectNodes(this.tree.focusedNode);
        }
        return;
      } else {
        if (!this.tree.focusedNode) {
          this.tree.addFocusedNode(this.tree.visibleNodes[0]);
        } else {
          this.tree.focusNext();
        }
        return;
      }
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();

      if (e.metaKey || e.ctrlKey) {
        if (this.tree.focusedNode) {
          this.tree.removeSelectedNodes(this.tree.focusedNode);
        }
        return;
      }
      if (e.shiftKey) {
        if (this.tree.focusedNode) {
          //this.tree.toggleSelectedNode(this.tree.focusedNode);
          if (!this.tree.multiselectAnchorNode)
            this.tree.multiselectAnchorNode = this;
          this.tree.focusPrevious();
          this.tree.calculateMultiselectNodes(this.tree.focusedNode);
        }
        return;
      }
      if (!this.tree.focusedNode) {
        this.tree.addFocusedNode(this.tree.visibleNodes[0]);
      } else {
        this.tree.focusPrevious();
      }
      return;
    }

    if (e.key === "ArrowRight") {
      if (!this.tree.focusedNode) return;
      if (!this.data.isLeaf && this.isOpen) {
        this.tree.focusNext();
      } else if (!this.data.isLeaf) this.expand();
      return;
    }

    if (e.key === "ArrowLeft") {
      if (!this.tree.focusedNode) return;
      if (!this.data.isLeaf && this.isOpen) this.toggleOpen();
      else if (this.parent) {
        this.tree.addFocusedNode(this.parent);
      }
      return;
    }

    if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.tree.addSelectedNodes(this.tree.visibleNodes);
      return;
    }

    /* if (e.key === "a" && !e.metaKey) {
      this.tree.createLeaf();
      return;
    } */

    /* if (e.key === "A" && !e.metaKey) {
      
      this.tree.createFolder();
      
    }
    */

    if (e.key === "Home") {
      // add shift keys
      e.preventDefault();
      this.tree.addFocusedNode(this.tree.rootNode);
      return;
    }

    if (e.key === "End") {
      // add shift keys
      e.preventDefault();
      const nodes = this.tree.visibleNodes;
      this.tree.addFocusedNode(nodes[nodes.length - 1]);
      return;
    }

    /*if (e.key === "Enter") {
      const node = tree.focusedNode;
      if (!node) return;
      if (!node.isEditable || !tree.props.onRename) return;
      setTimeout(() => {
        if (node) tree.edit(node);
      });
      return;
    }*/

    if (e.key === " ") {
      e.preventDefault();
      if (this.data.isLeaf) {
        this.tree.toggleSelectedNode(this);
      } else {
        this.toggleOpen();
      }
      return;
    }

    if (e.key === "*") {
      if (this.parent) {
        this.tree.expandNodeChildren(this.parent);
      } else {
        this.tree.expandNodeChildren(this);
      }
      return;
    }

    if (!e.shiftKey) {
      this.tree.multiselectAnchorNode = null;
      return;
    }
    /*
    if (e.key === "PageUp") {
      e.preventDefault();
      tree.pageUp();
      return;
    }
    if (e.key === "PageDown") {
      e.preventDefault();
      tree.pageDown();
    }
      */
  };

  handleKeyUp: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (!e.shiftKey) {
      this.tree.multiselectAnchorNode = null;
      this.tree.multiselectNodes = null;
    }
  };

  handleDragStart: React.DragEventHandler<HTMLDivElement> = (e) => {
    if (!this.tree.allowDragDrop) return;
    // Make sure the node being dragged is part of the selection. Dragging an
    // unselected node selects it first (unless ctrl is held to extend the
    // current multi-selection), otherwise nothing would be carried.
    if (!this.tree.selectedNodes.has(this)) {
      if (!e.ctrlKey) this.tree.clearSelectedNodes();
      this.tree.addSelectedNodes(this);
    }

    this.tree.dragSelectedNodes();
    const listOfDraggedNodes = [...this.tree.draggedNodes].map(
      (item) => item.data.id
    );

    e.dataTransfer.setData(
      "custom/treeDraggNodes",
      JSON.stringify({ nodes: listOfDraggedNodes })
    );
    e.dataTransfer.effectAllowed = "move";
  };

  handleDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    if (!this.tree.allowDragDrop) return;
    // Only react to internal tree drags (draggedNodes populated on drag start)
    if (this.tree.draggedNodes.size === 0) return;
    if (this.tree.draggedNodes.has(this)) return;

    // Must preventDefault to allow the subsequent drop event to fire
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const h = rect.height;

    let position: "before" | "after" | "into";
    if (!this.data.isLeaf && y >= h * 0.25 && y <= h * 0.75) {
      position = "into";
    } else if (y < h * 0.5) {
      position = "before";
    } else {
      position = "after";
    }

    this.tree.setDropTarget(this, position);
  };

  handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    if (!this.tree.allowDragDrop) {
      this.tree.clearDraggedNodes();
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const dropTarget = this.tree.dropTarget;
    const draggedIds = [...this.tree.draggedNodes].map((n) => n.data.id);
    if (!dropTarget || draggedIds.length === 0) {
      this.tree.clearDraggedNodes();
      return;
    }

    const targetFolderId =
      dropTarget.position === "into"
        ? dropTarget.node.data.id
        : (dropTarget.node.parent?.data.id ?? this.tree.rootNode.data.id);

    this.tree.onNodesMove?.(draggedIds, targetFolderId);
    this.tree.clearDraggedNodes();
  };

  handleDragEnter: React.DragEventHandler<HTMLDivElement> = () => {};

  handleDragLeave: React.DragEventHandler<HTMLDivElement> = () => {};

  handleDragEnd: React.DragEventHandler<HTMLDivElement> = () => {
    this.tree.clearDraggedNodes();
  };
}
