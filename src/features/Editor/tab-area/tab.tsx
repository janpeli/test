import { File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import { EditedFile } from "@/API/editor-api/editor-api.slice";
import { selectOpenFileId } from "@/API/editor-api/editor-api.selectors";
import {
  closeFile,
  setActiveFile,
  reorderFiles,
} from "@/API/editor-api/editor-api";
import { useState } from "react";

type TabProps = { editedFile: EditedFile; editorIdx: number };

export function Tab({ editedFile, editorIdx }: TabProps) {
  const openFileID = useAppSelectorWithParams(selectOpenFileId, { editorIdx });
  const [dragged, setDragged] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);

  const handleDragStart = (event: React.DragEvent) => {
    // Set drag data
    event.dataTransfer.setData("custom/draggedfileid", editedFile.id);
    // Set drag effect
    event.dataTransfer.effectAllowed = "move";
    setDragged(true);
  };

  const handleDragEnd = () => {
    setDragged(false);
    setIsDropTarget(false);
  };

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
    if (draggedFileId && draggedFileId !== editedFile.id) {
      reorderFiles(editedFile.id, draggedFileId);
    }
  };

  return (
    <div
      className={cn(
        "drop-target flex px-2 pt-2 pb-1 items-center gap-1 border-r whitespace-nowrap border-l-2 border-l-transparent group relative",
        editedFile.id === openFileID && "bg-muted border-b border-b-primary",
        dragged && "opacity-50",
        isDropTarget && "bg-muted/70 border-l-primary"
      )}
      onClick={(e) => {
        e.preventDefault();
        setActiveFile(editedFile.id);
      }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="tab"
      aria-selected={editedFile.id === openFileID}
      tabIndex={editedFile.id === openFileID ? 0 : -1}
      aria-controls={editedFile.id}
    >
      <File className="w-4 h-4 flex-shrink-0 pointer-events-none" />
      <span className="truncate max-w-[150px] pointer-events-none">
        {editedFile.name}
      </span>
      <Button
        variant="ghost"
        className="w-4 h-4 p-0 invisible hover:bg-muted-foreground group-hover:visible text-lg text-center align-middle"
        onClick={(e) => {
          e.stopPropagation();
          closeFile(editedFile.id);
        }}
      >
        <X className="w-4 h-4 pointer-events-none" />
      </Button>
    </div>
  );
}
//🗙
