import { File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import {
  EditedFile,
  selectOpenFileId,
} from "@/API/editor-api/editor-api.slice";
import { closeFile, setActiveFile } from "@/API/editor-api/editor-api";
import { useCallback, useState } from "react";

export function Tab({ editedFile }: { editedFile: EditedFile }) {
  const openFileID = useAppSelector(selectOpenFileId);
  const dispatch = useAppDispatch();
  const [dragged, setDragged] = useState(false);

  const dragEndHandler = () => {
    setDragged(false);
    window.removeEventListener("mouseup", dragEndHandler);
  };

  const dragStartHandler: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.dataTransfer.setData("text/plain", editedFile.id);
    setDragged(true);
  };

  return (
    <div
      key={editedFile.id}
      className={cn(
        "flex px-2 pt-2 pb-1 items-center gap-1 border-r whitespace-nowrap",
        editedFile.id === openFileID
          ? "bg-muted border-b border-b-primary"
          : "",
        dragged === true ? "opacity-50" : ""
      )}
      onClick={(e) => {
        e.preventDefault();
        setActiveFile(dispatch, editedFile.id);
      }}
      draggable
      onDragStart={dragStartHandler}
      onDragEnd={dragEndHandler}
      onDragEnter={() => console.log("drag enter captured" + editedFile.id)}
    >
      <File className="w-4 h-4" />
      {editedFile.name}
      <Button
        variant="ghost"
        className="w-4 h-4 p-0 hover:bg-muted-foreground"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          closeFile(dispatch, editedFile.id);
        }}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
