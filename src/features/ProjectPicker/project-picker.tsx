import { closeProject, openProject } from "@/API/project-api/project-api";
import {
  selectProjectLoading,
  selectProjectName,
} from "@/API/project-api/project-api.selectors";
import { selectGitInfo } from "@/API/git-api/git-api.selectors";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/hooks/hooks";
import { FolderOpen, GitBranch, X } from "lucide-react";

function ProjectPicker() {
  const projectName = useAppSelector(selectProjectName);
  const isLoading = useAppSelector(selectProjectLoading);
  const gitInfo = useAppSelector(selectGitInfo);

  return (
    <div className="flex-none border-t border-sidebar-border">
      {projectName ? (
        <div className="group flex flex-row items-center gap-2 h-11 px-2.5">
          <FolderOpen className="h-4 w-4 shrink-0 text-faint" />
          <div className="flex flex-1 flex-col min-w-0">
            <span
              className="truncate text-[13px] font-medium text-foreground"
              title={projectName}
            >
              {projectName}
            </span>
            <span className="flex flex-row items-center gap-1 font-mono text-[10.5px] text-faint">
              {gitInfo && !gitInfo.isRepo ? (
                <span>No git repository</span>
              ) : (
                <>
                  <GitBranch className="h-3 w-3 text-primary" />
                  <span className="truncate">
                    {gitInfo ? gitInfo.branch ?? "(detached)" : "…"}
                  </span>
                </>
              )}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0 text-faint opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
            onClick={closeProject}
            title="Close project"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => openProject()}
          variant="ghost"
          className="h-11 w-full justify-start gap-2 rounded-none px-2.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
          disabled={!!isLoading}
        >
          <FolderOpen className="h-4 w-4" />
          Open project
        </Button>
      )}
    </div>
  );
}

export default ProjectPicker;
