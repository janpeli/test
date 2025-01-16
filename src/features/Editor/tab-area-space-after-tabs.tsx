import { reorderFilesThisLast } from "@/API/editor-api/editor-api";
import { cn } from "@/lib/utils";
import { useState } from "react";

type TabAreaSpaceAfterTabsProps = {
  editorIdx: number;
};

export function TabAreaSpaceAfterTabs({
  editorIdx,
}: TabAreaSpaceAfterTabsProps) {
  const [isDropTarget, setIsDropTarget] = useState(false);

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (event.dataTransfer.types.includes("custom/draggedfileid")) {
      setIsDropTarget(true);
    }
  };

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer.types.includes("custom/draggedfileid")) {
      setIsDropTarget(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    // Check if we're leaving the main container, not just moving between children
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDropTarget(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDropTarget(false);

    const draggedFileId = event.dataTransfer.getData("custom/draggedfileid");

    reorderFilesThisLast(draggedFileId, editorIdx);
  };

  return (
    <div
      className={cn(
        "flex-1 min-w-[30px] border-l-2 border-l-transparent",
        isDropTarget && "bg-muted/70 border-l-primary"
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    />
  );
}
