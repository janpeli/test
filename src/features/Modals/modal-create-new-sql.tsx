import { createSqlFromModal } from "@/API/GUI-api/modal-api";
import { FileCode } from "lucide-react";
import CreateFileModal from "./create-file-modal";

function ModalCreateNewSql() {
  return (
    <CreateFileModal
      icon={FileCode}
      title="Create New SQL File"
      description="Enter a name for your new SQL file (.sql will be appended)"
      inputId="sql-file-name"
      placeholder="my-query"
      failureMessage="Failed to create file. Please try again."
      onCreate={createSqlFromModal}
    />
  );
}

export default ModalCreateNewSql;
