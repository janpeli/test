import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppSelectorWithParams } from "@/hooks/hooks";
import { EditedFile } from "@/API/editor-api/editor-api.slice";
import { selectOpenFileId } from "@/API/editor-api/editor-api.selectors";
import {
  requestCloseFile,
  setActiveFile,
  reorderFiles,
} from "@/API/editor-api/editor-api";
import { selectProjectPlugins } from "@/API/project-api/project-api.selectors";
import { FileIcon } from "@/lib/file-icon";
import { useState } from "react";

type TabProps = { editedFile: EditedFile; editorIdx: number };

export function Tab({ editedFile, editorIdx }: TabProps) {
  const openFileID = useAppSelectorWithParams(selectOpenFileId, { editorIdx });
  const plugins = useAppSelector(selectProjectPlugins);
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
        "drop-target flex h-full px-2.5 items-center gap-1.5 border-r border-border whitespace-nowrap font-mono text-xs group relative",
        editedFile.id === openFileID
          ? "bg-editor text-foreground shadow-[inset_0_-2px_0_hsl(var(--primary))]"
          : "text-faint hover:text-foreground",
        dragged && "opacity-50",
        isDropTarget && "bg-accent/70"
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
      <FileIcon name={editedFile.name} sufix={editedFile.sufix} plugin_uuid={editedFile.plugin_uuid} plugins={plugins} />
      <span
        className={cn(
          "truncate max-w-[150px] pointer-events-none",
          editedFile.isDirty && "italic font-medium"
        )}
      >
        {editedFile.name}
        {editedFile.isDirty && " *"}
      </span>
      <Button
        variant="ghost"
        className="w-4 h-4 p-0 invisible hover:bg-accent group-hover:visible text-faint"
        onClick={(e) => {
          e.stopPropagation();
          requestCloseFile(editedFile.id);
        }}
      >
        <X className="h-3 w-3 pointer-events-none" />
      </Button>
    </div>
  );
}
//🗙
