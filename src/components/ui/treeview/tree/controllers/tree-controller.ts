import { Commands } from "@/API";
import { IData, ITree } from "../interfaces";
import { NodeController } from "./node-controller";
import { retargetPasteFolder } from "@/lib/copy/paste-target.core";

export class TreeController implements ITree {
  data: IData;
  visibleNodes: NodeController[];
  rootNode: NodeController;
  levels: number;
  private setRenders?: React.Dispatch<React.SetStateAction<number>>;
  renders: number;

  nodeContextCommands?: (node: NodeController) => Commands;
  onDblClick?: (node: NodeController) => void;
  onNodesMove?: (
    draggedIds: string[],
    targetFolderId: string
  ) => void | Promise<boolean>;
  onNodesCopy?: (sourceIds: string[], targetFolderId: string) => void;
  // Fired whenever the clipboard changes (copy/cut/clear) so an external store
  // can mirror it for reactive UI (the menubar's Edit menu). `mode` is null when
  // the clipboard was cleared.
  onClipboardChange?: (
    ids: string[],
    mode: "copy" | "cut" | null
  ) => void;
  getNodeIcon?: (node: NodeController) => React.ReactNode;

  // Ids captured by the last copy/cut, pasted on Ctrl+V. `clipboardMode` decides
  // whether a paste copies (onNodesCopy) or moves (onNodesMove) them.
  clipboardIds: string[] = [];
  clipboardMode: "copy" | "cut" | null = null;

  allowDragDrop: boolean = false;
  dropTarget: { node: NodeController; position: "before" | "after" | "into" } | null = null;

  selectedNodes: Set<NodeController> = new Set<NodeController>();
  draggedNodes: Set<NodeController> = new Set<NodeController>();
  focusedNode?: NodeController;

  multiselectAnchorNode?: NodeController | null;
  multiselectNodes?: NodeController[] | null;

  isEditing: boolean = false;

  expandedNodes: Set<NodeController> = new Set<NodeController>();

  searTerm?: string;
  searchNodes: Set<NodeController> = new Set<NodeController>();

  defaultValue?: string;
  onSelect?: (value: string | string[]) => void;

  constructor(
    data: IData,
    renders: number,
    setRenders: React.Dispatch<React.SetStateAction<number>>
  ) {
    this.data = data;
    this.rootNode = this.createRootNode(this.data);
    this.levels = this.calculateLevels();
    this.visibleNodes = [];
    this.calculateVisibleNodes();
    this.setRenders = setRenders;
    this.renders = renders;
  }

  private createRootNode(data: IData): NodeController {
    const rootnode: NodeController = this.convertDataToNodes(data, null, -1);

    return rootnode;
  }

  private convertDataToNodes(
    data: IData,
    parent: NodeController | null,
    parentLevel: number
  ): NodeController {
    const result = new NodeController(data, parent, this, parentLevel + 1);
    /*
      level : parentLevel + 1,
      data :  data,
      parent : parent,
      tree : this, 
    */
    if (data.children) {
      result.children = data.children.map((value) =>
        this.convertDataToNodes(value, result, result.level)
      );
      // sort so the folders are first
      result.children.sort((a, b) => {
        if (a.data.isLeaf && !b.data.isLeaf) return 1;
        if (!a.data.isLeaf && b.data.isLeaf) return -1;
        if (a.data.name < b.data.name) {
          return -1;
        }
        if (a.data.name > b.data.name) {
          return 1;
        }
        return 0;
      });
    }

    return result;
  }

  private traverseTree(
    node: NodeController,
    callback: (node: NodeController) => void
  ) {
    // Process current node
    callback(node);

    // Process children
    if (node.children) {
      node.children.forEach((child) => this.traverseTree(child, callback));
    }
  }

  private calculateLevels(): number {
    let maxLevel: number = 0;
    this.traverseTree(this.rootNode, (node) => {
      maxLevel = Math.max(maxLevel, node.level);
    });
    return maxLevel;
  }

  private calculateVisibleNodes() {
    this.visibleNodes = [];
    this.traverseTree(this.rootNode, (node) => {
      const searchMatch = this.searTerm
        ? // node was found
          this.searchNodes.has(node)
        : //||
          // this is file and parrent is in found
          //(node.data.isLeaf &&
          //  this.searchNodes.has(node.parent as NodeController))
          true;
      if (
        ((node.parent && node.parent.isOpen) || node.parent === null) &&
        searchMatch
      ) {
        this.visibleNodes.push(node);
        //if (searchMatch) node.isOpen = true;
      } else {
        node.isOpen = false;
      }
    });
  }

  private render() {
    if (this.setRenders) {
      this.setRenders(++this.renders);
    }
  }
  public update() {
    this.calculateVisibleNodes();
    this.render();
  }

  /**
   * Expands the root node (collapsed by default) so its top-level children are
   * visible without a manual click. Idempotent — safe to call on every update.
   */
  public openRootNode() {
    if (this.rootNode.isOpen) return;
    this.rootNode.isOpen = true;
    this.update();
  }

  clearSelectedNodes() {
    if (this.selectedNodes.size > 0) {
      for (const node of this.selectedNodes) {
        node.isSelected = false;
        node.update();
      }
      this.selectedNodes.clear();
    }
    this.dispatchOnSelect();
  }

  addSelectedNodes(node: NodeController | NodeController[]) {
    if (Array.isArray(node) === false) {
      if (this.selectedNodes.has(node)) return;
      node.isSelected = true;
      this.selectedNodes.add(node);
      node.update();
    } else {
      for (const n of node) {
        if (this.selectedNodes.has(n)) continue;
        n.isSelected = true;
        this.selectedNodes.add(n);
        n.update();
      }
    }
    this.dispatchOnSelect();
  }

  addSelectedNodeByID(id: string | string[]) {
    this.traverseTree(this.rootNode, (node) => {
      if (node.data.id === id) {
        this.addSelectedNodes(node);
        this.openParentNodes(node);
        return;
      }
    });
  }

  addSelectedNodeByIDs(ids: string[]) {
    const nodeSet = new Set<NodeController>();
    this.traverseTree(this.rootNode, (node) => {
      if (ids.includes(node.data.id)) {
        nodeSet.add(node);
      }
    });
    const nodeArray: NodeController[] = Array.from(nodeSet);
    this.addSelectedNodes(nodeArray);
    this.openParentNodes(nodeArray);
  }

  dispatchOnSelect() {
    if (this.onSelect && this.selectedNodes.size) {
      const selection = Array.from(this.selectedNodes, (obj) => obj.data.id);
      if (selection.length === 1) {
        this.onSelect(selection[0]);
      } else {
        this.onSelect(selection);
      }
    }
  }

  removeSelectedNodes(node: NodeController | NodeController[]) {
    if (Array.isArray(node) === false) {
      if (!this.selectedNodes.has(node)) return;
      node.isSelected = false;
      this.selectedNodes.delete(node);
      node.update();
    } else {
      for (const n of node) {
        if (!this.selectedNodes.has(n)) return;
        n.isSelected = false;
        this.selectedNodes.delete(n);
        n.update();
      }
    }
    this.dispatchOnSelect();
  }

  toggleSelectedNode(node: NodeController) {
    if (this.selectedNodes.has(node)) {
      this.removeSelectedNodes(node);
      /*node.isSelected = false;
      this.selectedNodes.delete(node);
      node.update();*/
    } else {
      this.addSelectedNodes(node);
      /*node.isSelected = true;
      this.selectedNodes.add(node);
      node.update();*/
    }
  }

  addFocusedNode(node: NodeController) {
    if (this.focusedNode === node) return;
    if (this.focusedNode) {
      this.focusedNode.isFocused = false;
      this.focusedNode.update();
    }
    this.focusedNode = node;
    this.focusedNode.isFocused = true;
    this.focusedNode.update();
  }

  focusNext() {
    if (this.focusedNode && this.visibleNodes) {
      const currnetIndex = this.visibleNodes.findIndex(
        (n) => n.data.id === this.focusedNode?.data.id
      );
      if (currnetIndex < this.visibleNodes.length - 1)
        this.addFocusedNode(this.visibleNodes[currnetIndex + 1]);
    }
    return;
  }

  focusPrevious() {
    if (this.focusedNode && this.visibleNodes) {
      const currnetIndex = this.visibleNodes.findIndex(
        (n) => n.data.id === this.focusedNode?.data.id
      );
      if (currnetIndex - 1 >= 0)
        this.addFocusedNode(this.visibleNodes[currnetIndex - 1]);
    }
  }

  createLeaf() {}

  toggleNodeOpen(node: NodeController) {
    if (node.data.isLeaf) return;
    node.isOpen = !node.isOpen;
    node.update();
    node.tree.update();
  }

  expandNode(node: NodeController) {
    if (node.data.isLeaf || node.isOpen) return;
    node.isOpen = true;
    node.update();
    node.tree.update();
  }

  expandNodeChildren(node: NodeController) {
    if (node.children) {
      for (const child of node.children) {
        this.expandNode(child);
      }
    }
  }

  dragSelectedNodes() {
    if (this.selectedNodes.size) {
      for (const node of this.selectedNodes) {
        this.draggedNodes.add(node);
        node.isDragged = true;
        node.update();
      }
    }
  }

  /**
   * Captures the current selection into the clipboard for a later paste. If the
   * given node isn't part of the selection, it becomes the sole selection first
   * (mirrors handleDragStart: acting on an unselected node selects just it).
   */
  private setClipboard(node: NodeController, mode: "copy" | "cut") {
    if (!this.selectedNodes.has(node)) {
      this.clearSelectedNodes();
      this.addSelectedNodes(node);
    }
    this.clipboardIds = [...this.selectedNodes].map((n) => n.data.id);
    this.clipboardMode = mode;
    this.notifyClipboard();
  }

  /** Empties the clipboard. Used when a cut is consumed by a paste. */
  clearClipboard() {
    if (this.clipboardIds.length === 0 && this.clipboardMode === null) return;
    this.clipboardIds = [];
    this.clipboardMode = null;
    this.notifyClipboard();
  }

  // Pushes the current clipboard out to any external mirror (the Redux slice
  // wired in main-sidebar-tree-panel) so React UI stays in sync.
  private notifyClipboard() {
    this.onClipboardChange?.([...this.clipboardIds], this.clipboardMode);
  }

  /**
   * Drops clipboard ids that no longer exist after a tree refresh — e.g. the
   * copied node was deleted, or a partial cut-paste already relocated some of
   * them (their old ids vanish). Stops a stale copy/cut from re-pasting gone
   * items; clears the mode when nothing survives. Called from updateTreeData.
   */
  private pruneClipboard() {
    if (this.clipboardIds.length === 0) return;
    const surviving = this.clipboardIds.filter((id) => this.getNodeById(id));
    if (surviving.length === this.clipboardIds.length) return;
    this.clipboardIds = surviving;
    if (surviving.length === 0) this.clipboardMode = null;
    this.notifyClipboard();
  }

  /** Finds a node by its data id, anywhere in the (eagerly built) tree. */
  getNodeById(id: string): NodeController | undefined {
    let found: NodeController | undefined;
    this.traverseTree(this.rootNode, (node) => {
      if (node.data.id === id) found = node;
    });
    return found;
  }

  copyNodes(node: NodeController) {
    this.setClipboard(node, "copy");
  }

  cutNodes(node: NodeController) {
    this.setClipboard(node, "cut");
  }

  /**
   * Pastes the clipboard into the folder resolved from `node`. A cut pastes via
   * onNodesMove (a relocation, same rules as drag-drop) and clears the clipboard
   * only once the move is confirmed — a rejected move (e.g. invalid target)
   * leaves the cut selection intact so the user can retry. A copy pastes via
   * onNodesCopy and keeps the clipboard for repeated pasting.
   */
  async paste(node: NodeController) {
    if (this.clipboardIds.length === 0) return;
    // Pasting onto a folder that is itself on the clipboard means "duplicate it":
    // retarget to its parent so the copy lands beside it ("A" -> "A copy")
    // instead of being rejected as a paste into itself.
    const target = retargetPasteFolder(
      node.pasteTargetFolderId(),
      this.clipboardIds
    );
    if (this.clipboardMode === "cut") {
      const moved = await this.onNodesMove?.(this.clipboardIds, target);
      // Clear only once the move is confirmed — a rejected move leaves the cut
      // selection intact so the user can retry.
      if (moved) this.clearClipboard();
    } else {
      this.onNodesCopy?.(this.clipboardIds, target);
    }
  }

  clearDraggedNodes() {
    if (this.draggedNodes.size) {
      for (const node of this.draggedNodes) {
        node.isDragged = false;
        node.update();
      }
      this.draggedNodes.clear();
    }
    this.clearDropTarget();
  }

  setDropTarget(
    node: NodeController,
    position: "before" | "after" | "into"
  ) {
    if (
      this.dropTarget?.node === node &&
      this.dropTarget?.position === position
    )
      return;
    if (this.dropTarget) {
      const old = this.dropTarget.node;
      this.dropTarget = null;
      old.update();
    }
    this.dropTarget = { node, position };
    node.update();
  }

  clearDropTarget() {
    if (!this.dropTarget) return;
    const node = this.dropTarget.node;
    this.dropTarget = null;
    node.update();
  }

  search(term: string) {
    this.searchNodes.clear();
    this.searTerm = term;
    // if term is set to "" refresh tree normaly
    if (!term) {
      this.update();
      return;
    }

    // traverse tree and add matching nodes
    const foundNodes: Set<NodeController> = new Set<NodeController>();
    this.traverseTree(this.rootNode, (node) => {
      if (
        node.data.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .includes(
            term
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
          )
      ) {
        foundNodes.add(node);
      }
    });

    // I am also adding to found nodes
    for (const node of foundNodes) {
      let parentNode = node.parent;
      while (parentNode) {
        foundNodes.add(parentNode);
        parentNode.isOpen = true;
        parentNode = parentNode.parent;
      }
    }

    this.searchNodes = foundNodes;
    this.update();
  }

  openParentNodes(node: NodeController | NodeController[]) {
    if (!node) return;
    const foundNodes = Array.isArray(node) ? node : [node];
    for (const node of foundNodes) {
      let parentNode = node.parent;
      while (parentNode) {
        parentNode.isOpen = true;
        parentNode = parentNode.parent;
      }
    }
  }

  calculateMultiselectNodes(node: NodeController) {
    if (!this.multiselectAnchorNode)
      this.multiselectAnchorNode = this.focusedNode
        ? this.focusedNode
        : this.rootNode;

    const indexClicked = this.visibleNodes.indexOf(node);
    const indexAnchored = this.visibleNodes.indexOf(this.multiselectAnchorNode);

    const newMultiSelectedNodes: NodeController[] =
      indexClicked >= indexAnchored
        ? this.visibleNodes.slice(indexAnchored, indexClicked + 1)
        : this.visibleNodes.slice(indexClicked, indexAnchored + 1);

    if (this.multiselectNodes) {
      for (const node of this.multiselectNodes) {
        if (!newMultiSelectedNodes.includes(node)) {
          this.removeSelectedNodes(node);
        }
      }
    }

    this.addSelectedNodes(newMultiSelectedNodes);
    this.multiselectNodes = newMultiSelectedNodes;
    this.addFocusedNode(node);
  }

  updateTreeData(newData: IData) {
    // Helper function to find a node by id in children array
    const findNodeById = (
      nodes: NodeController[] | undefined,
      id: string
    ): NodeController | undefined => {
      return nodes?.find((node) => node.data.id === id);
    };

    // Helper function to update children of a node
    const updateChildren = (
      currentNode: NodeController,
      newChildrenData: IData[] | undefined
    ) => {
      if (!newChildrenData) {
        currentNode.children = undefined;
        return;
      }

      // Initialize children array if it doesn't exist
      if (!currentNode.children) {
        currentNode.children = [];
      }

      // Remove nodes that don't exist in new data
      currentNode.children = currentNode.children.filter((child) =>
        newChildrenData.some((newChild) => newChild.id === child.data.id)
      );

      // Add or update nodes from new data
      newChildrenData.forEach((newChildData) => {
        const existingChild = findNodeById(
          currentNode.children,
          newChildData.id
        );

        if (!existingChild) {
          // Create new node
          const newNode = this.convertDataToNodes(
            newChildData,
            currentNode,
            currentNode.level
          );
          currentNode.children?.push(newNode);
        } else {
          // Recursively update children of existing node
          updateChildren(existingChild, newChildData.children);
        }
      });

      // Sort children (folders first, then alphabetically)
      currentNode.children.sort((a, b) => {
        if (a.data.isLeaf && !b.data.isLeaf) return 1;
        if (!a.data.isLeaf && b.data.isLeaf) return -1;
        if (a.data.name < b.data.name) return -1;
        if (a.data.name > b.data.name) return 1;
        return 0;
      });
    };

    // Start update from root
    updateChildren(this.rootNode, newData.children);

    // Drop any clipboard ids that the refresh removed (deleted or already moved).
    this.pruneClipboard();

    // Recalculate tree properties
    this.levels = this.calculateLevels();
    this.update(); // This will recalculate visible nodes and trigger a re-render
  }
}
