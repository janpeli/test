import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarNavProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  items: {
    key: string;
    title: string;
  }[];
  defaultItem?: string;
  /**
   * Controlled active key (scroll-spy). When provided it wins over the internal
   * click state, so the highlighted tab follows the section scrolled into view.
   */
  activeKey?: string;
  onSelect?: (key: string) => void;
}

export function SidebarNav({
  className,
  items,
  defaultItem,
  activeKey,
  onSelect,
  ...props
}: SidebarNavProps) {
  const [clickedItem, setClickedItem] = useState(defaultItem);
  const active = activeKey ?? clickedItem;

  return (
    <nav className={cn("flex flex-wrap gap-1", className)} {...props}>
      {items.map((item) => (
        <Button
          key={item.key}
          variant={"ghost"}
          size={"sm"}
          className={cn(
            active === item.key
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline",
            "h-7 justify-start px-2"
          )}
          onClick={() => {
            setClickedItem(item.key);
            onSelect?.(item.key);
          }}
        >
          {item.title}
        </Button>
      ))}
    </nav>
  );
}
