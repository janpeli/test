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
  const [isCreating, setIsCreating] = useState(false);
  const [isSelectingFolder, setIsSelectingFolder] = useState(false);
  const [error, setError] = useState("");

  // Helper function for cross-platform path joining
  const joinPath = (folder: string, filename: string) => {
    // Use path.join if available, otherwise manual joining with proper separator detection
    const separator = folder.includes("/") ? "/" : "\\";
    return folder + separator + filename;
  };

  const selectFolder = async () => {
    if (isSelectingFolder) return; // Prevent multiple dialogs

    setIsSelectingFolder(true);
    try {
      setError("");
      const folder = await window.project.openFolderDialog();
      if (folder) {
        setSelectedFolder(folder);
      }
    } catch (err) {
      setError("Failed to select folder. Please try again.");
      console.error("Folder selection error:", err);
    } finally {
      setIsSelectingFolder(false);
    }
  };

  const handleCreateProject = async () => {
    // Validation
    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }

    if (!selectedFolder) {
      setError("Please select a folder");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const normalizedName = normalizeFilename(projectName.trim(), {
        replacement: "_",
      });
      const projectPath = joinPath(selectedFolder, normalizedName);

      await createProject(projectPath, projectName.trim());
      closeModals();
    } catch (err) {
      setError("Failed to create project. Please try again.");
      console.error("Project creation error:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const getProjectPath = () => {
    if (!projectName.trim() || !selectedFolder) return "";
    return joinPath(
      selectedFolder,
      normalizeFilename(projectName.trim(), { replacement: "_" })
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create new project</DialogTitle>
        <DialogDescription>Choose project name and location</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <Input
          value={projectName}
          onChange={(e) => {
            setProjectName(e.target.value);
            if (error) setError(""); // Clear error when user types
          }}
          placeholder="Project Name"
          disabled={isCreating || isSelectingFolder}
        />

        <Button
          variant="outline"
          onClick={selectFolder}
          disabled={isCreating || isSelectingFolder}
          className="w-full justify-start"
        >
          {isSelectingFolder
            ? "Selecting..."
            : selectedFolder || "Select folder"}
        </Button>

        {getProjectPath() && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Project location: </span>
            <span className="break-all">{getProjectPath()}</span>
          </div>
        )}

        {error && <div className="text-sm text-destructive">{error}</div>}
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button
            onClick={handleCreateProject}
            disabled={
              isCreating ||
              isSelectingFolder ||
              !projectName.trim() ||
              !selectedFolder
            }
          >
            {isCreating
              ? "Creating..."
              : "Create project and continue to editor"}
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button
            variant="secondary"
            onClick={closeModals}
            disabled={isCreating || isSelectingFolder}
          >
            Cancel
          </Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}

export default ModalCreateNewProject;
