import { Commands } from "@/API";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
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
  const createCommands = commands.filter((command) =>
    command.contextGroup.includes("Create")
  );
  const firstCreateIndex = commands.findIndex((command) =>
    command.contextGroup.includes("Create")
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        {commands.map((command, index) => {
          if (command.contextGroup.includes("Create")) {
            // Collapse all create commands into a single "New" submenu,
            // rendered in place of the first create command.
            if (index !== firstCreateIndex) return null;
            return (
              <ContextMenuSub key="create-group">
                <ContextMenuSubTrigger>New</ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  {createCommands.map((createCommand) => (
                    <ContextMenuItem
                      key={createCommand.displayName}
                      onSelect={createCommand.action}
                    >
                      {createCommand.displayName}
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
            );
          }
          return (
            <ContextMenuItem
              key={command.displayName}
              onSelect={command.action}
            >
              {command.displayName}
            </ContextMenuItem>
          );
        })}
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
