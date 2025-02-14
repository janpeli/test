import { useAppSelector } from "@/hooks/hooks";
import { selectModalState } from "@/API/GUI-api/modal.slice";
import { Dialog, DialogSimpleContent } from "@/components/ui/dialog";
import ModalCreateNewObject from "./modal-create-new-object";

const Modals = () => {
  const { isOpen } = useAppSelector(selectModalState);

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
        <ModalCreateNewObject />
      </DialogSimpleContent>
    </Dialog>
  );
};

export default Modals;
