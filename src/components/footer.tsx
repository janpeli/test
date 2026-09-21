import { selectActiveIdProjectNode } from "@/API/GUI-api/active-context.slice";
import { selectGitInfo } from "@/API/git-api/git-api.selectors";
import { selectErrorList } from "@/API/GUI-api/status-panel.slice";
import { setActivePanel, toggleStatusPanel } from "@/API/GUI-api/status-panel-api";
import { setActiveMenu } from "@/API/GUI-api/main-sidebar.slice";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import { AlertCircle, AlertTriangle, GitBranch } from "lucide-react";

export default function Footer() {
  const dispatch = useAppDispatch();
  const activeIdProjectNode = useAppSelector(selectActiveIdProjectNode);
  const gitInfo = useAppSelector(selectGitInfo);
  const errorList = useAppSelector(selectErrorList);

  const errorCount = errorList.filter((e) => e.type === "error").length;
  const warningCount = errorList.filter((e) => e.type === "warning").length;

  const goToRepoPanel = () => dispatch(setActiveMenu("Repo"));

  const goToProblems = () => {
    setActivePanel("Error");
    toggleStatusPanel();
  };

  return (
    <footer className="h-[22px] flex-none flex items-center justify-between px-2.5 border-t border-border bg-card font-mono text-[10.5px] text-faint">
      <div className="flex items-center gap-3">
        <button
          onClick={goToRepoPanel}
          className="flex items-center gap-1 truncate hover:text-foreground transition-colors"
          title="Open Repo panel"
        >
          {gitInfo?.isRepo ? (
            <>
              <GitBranch size={11} />
              {gitInfo.branch ?? "detached"}
            </>
          ) : (
            "not git"
          )}
        </button>

        <button
          onClick={goToProblems}
          className="flex items-center gap-2.5 hover:text-foreground transition-colors"
          title="Open Problems panel"
        >
          <span className="flex items-center gap-0.5">
            <AlertCircle size={11} />
            {errorCount}
          </span>
          <span className="flex items-center gap-0.5">
            <AlertTriangle size={11} />
            {warningCount}
          </span>
        </button>
      </div>

      <span className="truncate">
        <span className="text-muted-foreground">node</span>{" "}
        {activeIdProjectNode ? activeIdProjectNode : "—"}
      </span>
    </footer>
  );
}
