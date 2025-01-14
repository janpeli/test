import { closeProject } from "@/API/project-api/project-api";
import { selectProjectName } from "@/API/project-api/project-api.slice";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/hooks/hooks";
import { X } from "lucide-react";

function ProjectPicker() {
  const projectName = useAppSelector(selectProjectName);
  return (
    <>
      {projectName ? (
        <div className="min-w-[150px] border h-9 flex-row flex align-center justify-start items-center px-1 group">
          <div className="flex-1 flex flex-col px-1">
            <span className=" font-semibold text-xs">{projectName}</span>
            <span className=" font-thin text-xs">Main Branch</span>
          </div>
          <Button
            variant={"ghost"}
            className="w-5 h-5 p-0 invisible bg-muted group-hover:visible"
            onClick={closeProject}
          >
            <X className="w-4 h-4 " />
          </Button>
        </div>
      ) : null}
    </>
  );
}

export default ProjectPicker;
