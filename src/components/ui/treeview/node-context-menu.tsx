import React from "react";
import { Command, Commands, COMMAND_CATEGORIES } from "@/API";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "../context-menu";

interface NodeContextMenuProps {
  children: React.ReactNode;
  commands: Commands;
}

/** Commands in this category are collapsed into a single "New" submenu. */
const CREATE_CATEGORY = "Create";

function CommandMenuItem({ command }: { command: Command }) {
  return (
    <ContextMenuItem onSelect={command.action}>
      {command.displayName}
    </ContextMenuItem>
  );
}

function NodeContextMenu({ children, commands }: NodeContextMenuProps) {
  // Bucket by the fixed category order, dropping empty buckets, so menu
  // layout is consistent across call sites regardless of the array order
  // commands happen to be built in.
  const groups = COMMAND_CATEGORIES.map((category) =>
    commands.filter((command) => command.category === category)
  ).filter((group) => group.length > 0);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
        {commands.length === 0 && (
          <ContextMenuItem disabled>No actions allowed</ContextMenuItem>
        )}

        {groups.map((group, index) => (
          <React.Fragment key={group[0].category}>
            {index > 0 && <ContextMenuSeparator />}
            {group[0].category === CREATE_CATEGORY ? (
              <ContextMenuSub>
                <ContextMenuSubTrigger>New</ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  {group.map((command) => (
                    <CommandMenuItem key={command.displayName} command={command} />
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
            ) : (
              group.map((command) => (
                <CommandMenuItem key={command.displayName} command={command} />
              ))
            )}
          </React.Fragment>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default NodeContextMenu;
