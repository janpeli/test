export interface IData {
  id: string;
  name: string;
  isLeaf: boolean;
  children?: IData[];
}

export interface INode {
  data: IData;
  isOpen: boolean;
  parent: INode | null;
  children?: INode[];
  level: number;
}

export interface ITree {
  data: IData;
  visibleNodes: INode[];
  rootNode: INode;
  levels: number;
}
