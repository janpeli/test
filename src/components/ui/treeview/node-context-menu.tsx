import { Commands } from "@/API";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../context-menu";

export interface NodeAction {
  actionName: string;
  actionFunction: () => void;
}

interface NodeContextMenuProps {
  children: React.ReactNode;
  commands: Commands;
}

function NodeContextMenu({ children, commands }: NodeContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        {commands.map((command) => (
          <ContextMenuItem key={command.displayName} onSelect={command.action}>
            {command.displayName}
          </ContextMenuItem>
        ))}
        {!commands.length && (
          <ContextMenuItem key="NoCommand" disabled>
            No actions allowed
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default NodeContextMenu;
