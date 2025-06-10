import { useAppSelector } from "@/hooks/hooks";
import { selectModalState } from "@/API/GUI-api/modal.slice";
import { Dialog, DialogSimpleContent } from "@/components/ui/dialog";
import ModalCreateNewObject from "./modal-create-new-object";
import ModalCreateNewProject from "./modal-create-new-project";
import ModalCreateNewFolder from "./modal-create-new-folder";
import ModalAddNewPlugin from "./modal-add-new-plugin";
import ModalCreateNewModel from "./modal-create-new-model";

const Modals = () => {
  const { isOpen, type } = useAppSelector(selectModalState);

  return (
    <Dialog open={isOpen}>
      <DialogSimpleContent
        // className="sm:max-w-[425px] md:max-w-3xl"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          // bug in radix
          document.body.style.pointerEvents = "";
        }}
      >
        {type === "create-object" && <ModalCreateNewObject />}
        {type === "create-project" && <ModalCreateNewProject />}
        {type === "create-folder" && <ModalCreateNewFolder />}
        {type === "add-plugin" && <ModalAddNewPlugin />}
        {type === "create-model" && <ModalCreateNewModel />}
      </DialogSimpleContent>
    </Dialog>
  );
};

export default Modals;
