import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useAppSelector, useAppSelectorWithParams } from "@/hooks/hooks";
import { selectEditedFilesIds } from "@/API/editor-api/editor-api.selectors";
import { selectProjectPath } from "@/API/project-api/project-api.selectors";
import {
  requestCloseFile,
  requestCloseFiles,
} from "@/API/editor-api/editor-api";
import { getCloseTargets, toAbsolutePath } from "./tab-context.core";

interface TabContextMenuProps {
  children: React.ReactNode;
  fileId: string;
  fileName: string;
  editorIdx: number;
}

/**
 * Right-click menu for an editor tab. Bulk close items are scoped to the
 * tab's own pane (`editorIdx`); a file also open in another pane closes there
 * too — the same semantics as the tab's ✕ button. Right-clicking does not
 * activate the tab (the tab's onClick only fires on left click).
 */
function TabContextMenu({
  children,
  fileId,
  fileName,
  editorIdx,
}: TabContextMenuProps) {
  const tabIds =
    useAppSelectorWithParams(selectEditedFilesIds, { editorIdx }) ?? [];
  const folderPath = useAppSelector(selectProjectPath);
  const idx = tabIds.indexOf(fileId);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
        <ContextMenuItem onSelect={() => requestCloseFile(fileId)}>
          Close
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() =>
            requestCloseFiles(getCloseTargets(tabIds, fileId, "all"))
          }
        >
          Close All
        </ContextMenuItem>
        <ContextMenuItem
          disabled={idx <= 0}
          onSelect={() =>
            requestCloseFiles(getCloseTargets(tabIds, fileId, "left"))
          }
        >
          Close to the Left
        </ContextMenuItem>
        <ContextMenuItem
          disabled={idx < 0 || idx === tabIds.length - 1}
          onSelect={() =>
            requestCloseFiles(getCloseTargets(tabIds, fileId, "right"))
          }
        >
          Close to the Right
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          disabled={!folderPath}
          onSelect={() =>
            folderPath &&
            navigator.clipboard.writeText(toAbsolutePath(folderPath, fileId))
          }
        >
          Copy Path
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => navigator.clipboard.writeText(fileName)}
        >
          Copy File Name
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default TabContextMenu;
