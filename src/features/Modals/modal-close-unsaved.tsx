import { useAppSelector } from "@/hooks/hooks";
import { selectModalState } from "@/API/GUI-api/modal.slice";
import { selectAnyEditedFileById } from "@/API/editor-api/editor-api.selectors";
import {
  closeModals,
  discardAndCloseFile,
  saveAndCloseFile,
} from "@/API/GUI-api/modal-api";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

function ModalCloseUnsaved() {
  const { id } = useAppSelector(selectModalState);
  const name = useAppSelector((state) =>
    id ? selectAnyEditedFileById(state, id)?.name : undefined
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Unsaved changes
        </DialogTitle>
        <DialogDescription>
          {name ? `"${name}"` : "This file"} has unsaved changes. Do you want to
          save them before closing?
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" onClick={closeModals}>
            Cancel
          </Button>
        </DialogClose>

        <Button variant="destructive" onClick={discardAndCloseFile}>
          Don't save
        </Button>

        <Button onClick={saveAndCloseFile}>Save</Button>
      </DialogFooter>
    </>
  );
}

export default ModalCloseUnsaved;
