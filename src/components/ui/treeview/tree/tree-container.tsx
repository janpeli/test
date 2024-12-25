import { useEffect, useRef, useState } from "react";
import { TreeController } from "./controllers/tree-controller";
import TreeRow from "./tree-row";
import React from "react";
import { useDebounceValue } from "@/hooks/hooks";
//import { ScrollArea } from "../../scroll-area";

interface TreeContainerProps {
  tree: TreeController;
  height: number;
}

function TreeContainer(props: TreeContainerProps) {
  const treeContRef = useRef<HTMLDivElement>(null);

  // to find quickly a node by typing starting leters
  const [focusSearchTerm, setFocusSearchTerm] = useState<string>("");
  const debouncedSearch = useDebounceValue(focusSearchTerm, 300);

  // debounced value used to search the tree as you type
  useEffect(() => {
    if (debouncedSearch) {
      const node = props.tree.visibleNodes.find((n) => {
        const name = n.data.name;
        if (typeof name === "string" && debouncedSearch) {
          return name.toLowerCase().startsWith(debouncedSearch);
        } else return false;
      });
      if (node) props.tree.addFocusedNode(node);
      setFocusSearchTerm("");
    }
    return () => {};
  }, [debouncedSearch]);

  // setting search string as you type
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    setFocusSearchTerm(focusSearchTerm + e.key);
  };

  return (
    <>
      <div
        role="tree"
        aria-label="File tree"
        onKeyDown={handleKeyDown}
        className="relative font-mono text-sm"
        ref={treeContRef}
      >
        {props.tree.visibleNodes.map((node) => (
          <TreeRow key={node.data.id} node={node} containerRef={treeContRef} />
        ))}
      </div>
    </>
  );
}

export default TreeContainer;
