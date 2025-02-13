import { useAppSelector } from "@/hooks/hooks";
import { selectModalState } from "@/API/GUI-api/modal.slice";
import { closeModals } from "@/API/GUI-api/modal-api";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSimpleContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Modals = () => {
  const { isOpen, title, content } = useAppSelector(selectModalState);

  return (
    <Dialog open={isOpen}>
      <DialogSimpleContent
        className="sm:max-w-[425px]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          // bug in radix
          document.body.style.pointerEvents = "";
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        {content}
        <DialogFooter>
          <DialogClose>
            <Button type="button" onClick={() => closeModals()}>
              Save changes
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogSimpleContent>
    </Dialog>
  );
};

export default Modals;
