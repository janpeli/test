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

  const dragEndHandler = useCallback(() => {
    setDragged(false);
    window.removeEventListener("mouseup", dragEndHandler);
  }, []);

  const dragStartHandler: React.DragEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      event.stopPropagation();
      event.preventDefault();
      event.dataTransfer.setData("text/plain", editedFile.id);
      window.addEventListener("mouseup", dragEndHandler);
      setDragged(true);
    },
    [editedFile, dragEndHandler]
  );

  return (
    <div
      key={editedFile.id}
      className={cn(
        "flex px-2 pt-2 pb-1 items-center gap-1 border-r whitespace-nowrap",
        editedFile.id === openFileID ? "bg-muted" : ""
        //dragged === true ? "bg-white" : ""
      )}
      onClick={(e) => {
        e.preventDefault();
        setActiveFile(dispatch, editedFile.id);
      }}
      draggable
      onDragStart={dragStartHandler}
      onDragEndCapture={(event) => {
        event.stopPropagation();
        event.preventDefault();
        console.log("drag end captured");
      }}
      onDragExitCapture={() => console.log("drag exit captured")}
      onDragStartCapture={() =>
        console.log("drag start captured" + editedFile.id)
      }
      onDragEnter={() => console.log("drag start captured" + editedFile.id)}
    >
      <File className="w-4 h-4" />
      {editedFile.name}
      {dragged === true ? "- dragged" : null}
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
