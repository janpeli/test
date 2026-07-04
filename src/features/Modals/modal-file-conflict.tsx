import { closeModals, overwriteFromConflictModal } from "@/API/GUI-api/modal-api";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

function ModalFileConflict() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          File changed on disk
        </DialogTitle>
        <DialogDescription>
          This file has changed on disk since it was opened. Saving now will
          overwrite those external changes.
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" onClick={closeModals}>
            Cancel
          </Button>
        </DialogClose>

        <Button variant="destructive" onClick={overwriteFromConflictModal}>
          Overwrite
        </Button>
      </DialogFooter>
    </>
  );
}

export default ModalFileConflict;
