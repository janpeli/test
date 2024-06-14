import { File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import {
  EditedFile,
  selectEditedFiles,
  selectOpenFileId,
} from "@/API/editor-api/editor-api.slice";
import { closeFile, setActiveFile } from "@/API/editor-api/editor-api";

function Tab({ editedFile }: { editedFile: EditedFile }) {
  const openFileID = useAppSelector(selectOpenFileId);
  const dispatch = useAppDispatch();

  return (
    <div
      className={cn(
        "flex px-2 pt-2 pb-1 items-center gap-1 border-r",
        editedFile.id == openFileID ? "bg-muted" : ""
      )}
      onClick={(e) => {
        e.preventDefault();
        setActiveFile(dispatch, editedFile.id);
      }}
    >
      <File className="w-4 h-4" />
      {editedFile.name}

      <Button
        variant="ghost"
        className="w-4 h-4 p-0 hover:bg-muted-foreground"
        onClick={(e) => {
          e.preventDefault();
          closeFile(dispatch, editedFile.id);
        }}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

function TabArea() {
  const editorData = useAppSelector(selectEditedFiles);
  return (
    <div className="overflow-x-hidden relative border-b bg-background select-none cursor-pointer">
      <div className="flex whitespace-nowrap transition-transform w-[max-content] ">
        {editorData.map((item) => (
          <Tab key={item.id} editedFile={item} />
        ))}
      </div>
    </div>
  );
}

export default function ContentArea() {
  const editorData = useAppSelector(selectEditedFiles);
  return (
    <div className="flex-1 bg-muted">{editorData ? <TabArea /> : null}</div>
  );
}
