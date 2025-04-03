import { useAppSelector } from "@/hooks/hooks";
import { selectModalState } from "@/API/GUI-api/modal.slice";
import { Dialog, DialogSimpleContent } from "@/components/ui/dialog";
import ModalCreateNewObject from "./modal-create-new-object";
import ModalCreateNewProject from "./modal-create-new-project";
import ModalCreateNewFolder from "./modal-create-new-folder";

const Modals = () => {
  const { isOpen, type } = useAppSelector(selectModalState);

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
        {type === "create-object" && <ModalCreateNewObject />}
        {type === "create-project" && <ModalCreateNewProject />}
        {type === "create-folder" && <ModalCreateNewFolder />}
      </DialogSimpleContent>
    </Dialog>
  );
};

export default Modals;
