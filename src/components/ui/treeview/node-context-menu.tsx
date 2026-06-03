import { Command, Commands } from "@/API";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "../context-menu";

interface NodeContextMenuProps {
  children: React.ReactNode;
  commands: Commands;
}

/** Commands in this context group are collapsed into a single "New" submenu. */
const CREATE_GROUP = "Create";

const isCreateCommand = (command: Command) =>
  command.contextGroup.includes(CREATE_GROUP);

function CommandMenuItem({ command }: { command: Command }) {
  return (
    <ContextMenuItem onSelect={command.action}>
      {command.displayName}
    </ContextMenuItem>
  );
}

function NodeContextMenu({ children, commands }: NodeContextMenuProps) {
  const createCommands = commands.filter(isCreateCommand);
  // Anchor the "New" submenu at the position of the first create command so
  // the surrounding commands keep their original order.
  const createAnchorIndex = commands.findIndex(isCreateCommand);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
        {commands.length === 0 && (
          <ContextMenuItem disabled>No actions allowed</ContextMenuItem>
        )}

        {commands.map((command, index) => {
          if (!isCreateCommand(command)) {
            return <CommandMenuItem key={command.displayName} command={command} />;
          }
          // Render the whole create group once, in place of the first member.
          if (index !== createAnchorIndex) return null;
          return (
            <ContextMenuSub key="create-group">
              <ContextMenuSubTrigger>New</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {createCommands.map((createCommand) => (
                  <CommandMenuItem
                    key={createCommand.displayName}
                    command={createCommand}
                  />
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
          );
        })}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default NodeContextMenu;
