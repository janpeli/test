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
  actions: NodeAction[];
}

function NodeContextMenu({ children, actions }: NodeContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        {actions.map((action) => (
          <ContextMenuItem onSelect={action.actionFunction}>
            {action.actionName}
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default NodeContextMenu;
