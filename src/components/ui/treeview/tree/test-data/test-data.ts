import { IData } from "../interfaces";

export const testData: IData = {
  id: "0",
  name: "root name",
  isLeaf: false,
  children: [
    {
      id: "1",
      name: "Root Item 1",
      isLeaf: false,
      children: [
        {
          id: "1-1",
          name: "Child 1-1",
          isLeaf: true,
        },
        {
          id: "1-2",
          name: "Child 1-2",
          isLeaf: false,
          children: [
            {
              id: "1-2-1",
              name: "Grandchild 1-2-1",
              isLeaf: true,
            },
            {
              id: "1-2-2",
              name: "Grandchild 1-2-2",
              isLeaf: true,
            },
          ],
        },
      ],
    },
    {
      id: "2",
      name: "Root Item 2",
      isLeaf: false,
      children: [
        {
          id: "2-1",
          name: "Child 2-1",
          isLeaf: true,
        },
      ],
    },
    {
      id: "3",
      name: "Root Item 3",
      isLeaf: true,
    },
  ],
};
