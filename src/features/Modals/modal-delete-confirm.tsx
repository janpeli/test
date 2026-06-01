import { closeModals, deleteFromModal } from "@/API/GUI-api/modal-api";
import { selectModalState } from "@/API/GUI-api/modal.slice";
import { getProjectStructurebyId } from "@/API/project-api/project-api";
import { useAppSelector } from "@/hooks/hooks";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function ModalDeleteConfirm() {
  const { id } = useAppSelector(selectModalState);

  const { name, isFolder } = useMemo(() => {
    const node = id ? getProjectStructurebyId(id) : null;
    return {
      name: node?.name ?? node?.id.split("/").pop() ?? "",
      isFolder: node?.isFolder ?? false,
    };
  }, [id]);

  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus the destructive action so Enter confirms and Esc cancels.
  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteFromModal();
      closeModals();
    } catch (err) {
      setError("Failed to delete. Please try again.");
      console.error("Error deleting:", err);
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const kind = isFolder ? "folder" : "file";

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Delete {kind}
        </DialogTitle>
        <DialogDescription>
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">{name}</span>?
          {isFolder ? " Its contents will be deleted too." : ""} This action
          cannot be undone.
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <DialogFooter>
        <DialogClose asChild>
          <Button
            variant="secondary"
            onClick={closeModals}
            disabled={isDeleting}
          >
            Cancel
          </Button>
        </DialogClose>

        <Button
          ref={confirmRef}
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
          className="min-w-[120px]"
        >
          {isDeleting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              Deleting...
            </div>
          ) : (
            "Delete"
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

export default ModalDeleteConfirm;
