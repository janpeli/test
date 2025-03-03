import { closeModals } from "@/API/GUI-api/modal-api";
import { createProject } from "@/API/project-api/project-api";
import { normalizeFilename } from "@/API/project-api/utils";
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

function ModalCreateNewProject() {
  const [selectedFolder, setSelectedFolder] = useState("");
  const [projectName, setProjectName] = useState("");

  async function selectFolder() {
    const selectedFolder = await window.project.openFolderDialog();
    setSelectedFolder(selectedFolder);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create new project</DialogTitle>
        <DialogDescription>Choose project name and location</DialogDescription>
      </DialogHeader>
      <Input
        onChange={(event) => {
          setProjectName(event.target.value);
        }}
        placeholder="Project Name"
      />
      <Button
        variant={"outline"}
        onClick={() => {
          selectFolder();
        }}
      >
        {selectedFolder || "Select folder"}
      </Button>
      <span className="">
        {"Project location: "}
        {projectName && selectedFolder
          ? selectedFolder +
            "\\" +
            normalizeFilename(projectName, { replacement: "_" })
          : ""}
      </span>

      <DialogFooter>
        <DialogClose asChild>
          <Button
            onClick={() => {
              createProject(
                selectedFolder +
                  "\\" +
                  normalizeFilename(projectName, { replacement: "_" }),
                projectName
              );
              closeModals();
            }}
          >
            Create project and continue to editor
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

export default ModalCreateNewProject;
