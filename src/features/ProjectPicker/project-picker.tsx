import { closeProject, openProject } from "@/API/project-api/project-api";
import {
  selectProjectLoading,
  selectProjectName,
} from "@/API/project-api/project-api.selectors";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/hooks/hooks";
import { GitBranch, X } from "lucide-react";

function ProjectPicker() {
  const projectName = useAppSelector(selectProjectName);
  const isLoading = useAppSelector(selectProjectLoading);
  return (
    <>
      <div className="min-w-[150px] max-w-sm border h-12 flex-row flex align-center justify-start items-center px-1 group m-2 shadow p-2 pr-4">
        {projectName ? (
          <>
            <div className="flex-1 flex flex-col px-1">
              <span className=" text-base">{projectName}</span>
              <span className=" text-muted-foreground flex flex-row justify-start items-center space-x-1">
                <GitBranch className="w-3 h-3" />
                <span>{"Main Branch"}</span>
              </span>
            </div>
            <Button
              variant={"ghost"}
              className="w-5 h-5 p-0 invisible bg-muted group-hover:visible"
              onClick={closeProject}
            >
              <X className="w-4 h-4 " />
            </Button>
          </>
        ) : (
          <Button
            onClick={() => openProject()}
            variant={"ghost"}
            className="flex-1"
            disabled={isLoading ? true : false}
          >
            Open project
          </Button>
        )}
      </div>
    </>
  );
}

export default ProjectPicker;
