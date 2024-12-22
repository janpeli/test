import { useCallback, useEffect, useState } from "react";
import { TreeController } from "./controllers/tree-controller";
import TreeRow from "./tree-row";
import React from "react";
import { useDebounceValue } from "@/hooks/hooks";

interface TreeContainerProps {
  tree: TreeController;
}

function TreeContainer(props: TreeContainerProps) {
  // to find quickly a node by typing starting leters
  const [focusSearchTerm, setFocusSearchTerm] = useState<string>("");
  const debouncedSearch = useDebounceValue(focusSearchTerm, 300);

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    setFocusSearchTerm(focusSearchTerm + e.key);
  };

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

  return (
    <>
      <div
        role="tree"
        aria-label="File tree"
        onKeyDown={handleKeyDown}
        className="relative font-mono text-sm"
      >
        {props.tree.visibleNodes.map((node) => (
          <TreeRow key={node.data.id} node={node} />
        ))}
      </div>
    </>
  );
}

export default TreeContainer;
