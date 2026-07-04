import { closeModals, closeWithoutSaving } from "@/API/GUI-api/modal-api";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

function ModalUnsavedChanges() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Unsaved changes
        </DialogTitle>
        <DialogDescription>
          One or more open files have unsaved changes. Closing now will
          discard them.
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" onClick={closeModals}>
            Cancel
          </Button>
        </DialogClose>

        <Button variant="destructive" onClick={closeWithoutSaving}>
          Close without saving
        </Button>
      </DialogFooter>
    </>
  );
}

export default ModalUnsavedChanges;
