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
    } else {
      console.log("You can't call update before setRenders is defined!");
    }
  }

  handleClick: MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      this.tree.toggleSelectedNode(this);
      this.tree.addFocusedNode(this);
      return;
    }
    if (e.shiftKey) {
      if (this.tree.multiselectNodes) {
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
      this.tree.addFocusedNode(this);
      console.log(this.tree.multiselectNodes);
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
          this.tree.focusNext();
          this.tree.toggleSelectedNode(this.tree.focusedNode);
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
          this.tree.toggleSelectedNode(this.tree.focusedNode);
          this.tree.focusPrevious();
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

    /*if (e.shiftKey) {
      this.tree.multiselectAnchorNode = this;
    }*/
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
    if (e.ctrlKey) {
      this.tree.addSelectedNodes(this);
    } else if (this.tree.selectedNodes.size === 1) {
      this.tree.clearSelectedNodes();
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
    console.log("Drag Start");
  };

  handleDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault(); // Allow dropping
    if (!e.dataTransfer.types.includes("custom/treeDraggNodes")) return;
    if (this.tree.draggedNodes.has(this)) return;
  };

  handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    this.tree.clearDraggedNodes();
    console.log("Drop");
    console.log(e.dataTransfer.getData("custom/treeDraggNodes"));
  };

  handleDragEnter: React.DragEventHandler<HTMLDivElement> = () => {};

  handleDragLeave: React.DragEventHandler<HTMLDivElement> = () => {};

  handleDragEnd: React.DragEventHandler<HTMLDivElement> = () => {
    this.tree.clearDraggedNodes();
    console.log("Drag END");
  };
}
