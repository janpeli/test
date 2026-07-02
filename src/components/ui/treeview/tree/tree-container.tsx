import { useEffect, useRef, useState } from "react";
import { List, useListRef } from "react-window";
import { TreeController } from "./controllers/tree-controller";
import TreeRow from "./tree-row";
import React from "react";
import { useDebounceValue } from "@/hooks/hooks";

/** Fixed row height in px — must match the h-6 (24px) row in tree-node.tsx. */
export const TREE_ROW_HEIGHT = 24;

/** Drag auto-scroll: zone size at the top/bottom of the viewport and the
 * scroll speed at the outermost edge (px per frame, scales with proximity). */
const DRAG_SCROLL_EDGE = 36;
const DRAG_SCROLL_MAX_SPEED = 14;

interface TreeContainerProps {
  tree: TreeController;
}

function TreeContainer(props: TreeContainerProps) {
  const listRef = useListRef(null);

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
  }, [debouncedSearch, props.tree]);

  // setting search string as you type
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    setFocusSearchTerm(focusSearchTerm + e.key);
  };

  // Auto-scroll while dragging near the viewport edge, so nodes can be
  // dropped on folders that are off-screen. dragover fires continuously
  // (at least every ~350ms even with the pointer stationary) and bubbles
  // from the rows to the List root; a rAF loop does the smooth scrolling
  // and a watchdog stops it when dragover events cease (drop, dragend,
  // drag leaving the tree or the window).
  const dragScroll = useRef<{ raf: number | null; speed: number; last: number }>(
    { raf: null, speed: 0, last: 0 }
  );

  const stopDragScroll = () => {
    if (dragScroll.current.raf !== null) {
      cancelAnimationFrame(dragScroll.current.raf);
      dragScroll.current.raf = null;
    }
    dragScroll.current.speed = 0;
  };

  useEffect(() => stopDragScroll, []);

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    if (!tree.allowDragDrop || tree.draggedNodes.size === 0) return;
    const el = listRef.current?.element;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    let speed = 0;
    if (e.clientY < rect.top + DRAG_SCROLL_EDGE) {
      speed = -Math.ceil(
        ((rect.top + DRAG_SCROLL_EDGE - e.clientY) / DRAG_SCROLL_EDGE) *
          DRAG_SCROLL_MAX_SPEED
      );
    } else if (e.clientY > rect.bottom - DRAG_SCROLL_EDGE) {
      speed = Math.ceil(
        ((e.clientY - (rect.bottom - DRAG_SCROLL_EDGE)) / DRAG_SCROLL_EDGE) *
          DRAG_SCROLL_MAX_SPEED
      );
    }

    dragScroll.current.speed = speed;
    dragScroll.current.last = performance.now();

    if (speed !== 0 && dragScroll.current.raf === null) {
      const step = () => {
        const s = dragScroll.current;
        if (s.speed === 0 || performance.now() - s.last > 400) {
          s.raf = null;
          s.speed = 0;
          return;
        }
        el.scrollTop += s.speed;
        s.raf = requestAnimationFrame(step);
      };
      dragScroll.current.raf = requestAnimationFrame(step);
    }
  };

  // Scroll the focused row into view. The focused row may be unmounted
  // (virtualized away), so this runs at the container: addFocusedNode bumps
  // focusEpoch and forces a tree-level render, then the row's own effect
  // performs the DOM .focus() once it mounts.
  const { tree } = props;
  const { focusEpoch } = tree;
  useEffect(() => {
    const focused = tree.focusedNode;
    if (!focused) return;
    const index = tree.visibleNodes.indexOf(focused);
    if (index < 0) return; // collapsed/filtered away — scrollToRow would throw
    listRef.current?.scrollToRow({ index, align: "auto" });
  }, [tree, focusEpoch, listRef]);

  return (
    <List
      role="tree"
      aria-label="File tree"
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDrop={stopDragScroll}
      onDragEnd={stopDragScroll}
      className="flex-1 min-h-0 w-full font-mono text-sm"
      listRef={listRef}
      rowComponent={TreeRow}
      rowCount={tree.visibleNodes.length}
      rowHeight={TREE_ROW_HEIGHT}
      // epoch: any tree-level render must repaint all mounted rows — rows are
      // keyed by index, so visibleNodes[index] may now be a different node.
      rowProps={{ tree, epoch: tree.renders }}
      overscanCount={10}
    />
  );
}

export default TreeContainer;
