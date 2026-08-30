import { createDrawioFromModal } from "@/API/GUI-api/modal-api";
import { Shapes } from "lucide-react";
import CreateFileModal from "./create-file-modal";

function ModalCreateNewDrawio() {
  return (
    <CreateFileModal
      icon={Shapes}
      title="Create New Drawio Diagram"
      description="Enter a name for your new diagram file (.drawio will be appended)"
      inputId="drawio-file-name"
      placeholder="my-diagram"
      failureMessage="Failed to create drawio file. Please try again."
      onCreate={createDrawioFromModal}
    />
  );
}

export default ModalCreateNewDrawio;
