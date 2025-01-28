import { IData, ITree } from "../interfaces";
import { NodeController } from "./node-controller";

export class TreeController implements ITree {
  data: IData;
  visibleNodes: NodeController[];
  rootNode: NodeController;
  levels: number;
  private setRenders?: React.Dispatch<React.SetStateAction<number>>;
  renders: number;

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

  createLeaf() {
    console.log(`Create leaf`);
  }

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

  clearDraggedNodes() {
    if (this.draggedNodes.size) {
      for (const node of this.draggedNodes) {
        node.isDragged = false;
        node.update();
      }
      this.draggedNodes.clear();
    }
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
}
