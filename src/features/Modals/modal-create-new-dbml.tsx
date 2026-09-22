import { createDbmlFromModal } from "@/API/GUI-api/modal-api";
import { Database } from "lucide-react";
import CreateFileModal from "./create-file-modal";

function ModalCreateNewDbml() {
  return (
    <CreateFileModal
      icon={Database}
      title="Create New DBML Schema"
      description="Enter a name for your new DBML schema file (.dbml will be appended)"
      inputId="dbml-file-name"
      placeholder="my-schema"
      failureMessage="Failed to create DBML file. Please try again."
      onCreate={createDbmlFromModal}
    />
  );
}

export default ModalCreateNewDbml;
