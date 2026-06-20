import {
  selectActiveIdProjectFolder,
  selectActiveIdProjectNode,
} from "@/API/GUI-api/active-context.slice";
import { useAppSelector } from "@/hooks/hooks";

export default function Footer() {
  const activeIdProjectNode = useAppSelector(selectActiveIdProjectNode);
  const activeIdProjectFolder = useAppSelector(selectActiveIdProjectFolder);

  return (
    <footer className="h-[22px] flex-none flex items-center justify-between px-2.5 border-t border-border bg-card font-mono text-[10.5px] text-faint">
      <span className="truncate">
        <span className="text-muted-foreground">node</span>{" "}
        {activeIdProjectNode ? activeIdProjectNode : "—"}
      </span>

      <span className="truncate">
        <span className="text-muted-foreground">folder</span>{" "}
        {activeIdProjectFolder ? activeIdProjectFolder : "—"}
      </span>
    </footer>
  );
}
