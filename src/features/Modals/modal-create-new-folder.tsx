import { closeModals, createFolderFromModal } from "@/API/GUI-api/modal-api";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { useState } from "react";

function ModalCreateNewFolder() {
  const [folderName, setFolderName] = useState("");

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create new folder</DialogTitle>
        <DialogDescription>Choose folder name and location</DialogDescription>
      </DialogHeader>
      <Input
        onChange={(event) => {
          setFolderName(event.target.value);
        }}
        placeholder="Folder Name"
      />

      <DialogFooter>
        <DialogClose asChild>
          <Button
            onClick={() => {
              createFolderFromModal(folderName);
            }}
          >
            Create folder and continue to editor
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button variant="secondary" onClick={() => closeModals()}>
            Cancel
          </Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}

export default ModalCreateNewFolder;
