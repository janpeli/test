import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    key: string;
    title: string;
  }[];
  defaultItem?: string;
  onSelect?: (key: string) => void;
}

export function SidebarNav({
  className,
  items,
  defaultItem,
  onSelect,
  ...props
}: SidebarNavProps) {
  const [activeItem, setActiveItem] = useState(defaultItem);

  return (
    <nav className={cn("flex flex-wrap gap-1", className)} {...props}>
      {items.map((item) => (
        <Button
          key={item.key}
          variant={"ghost"}
          size={"sm"}
          className={cn(
            activeItem === item.key
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline",
            "h-7 justify-start px-2"
          )}
          onClick={() => {
            setActiveItem(item.key);
            onSelect?.(item.key);
          }}
        >
          {item.title}
        </Button>
      ))}
    </nav>
  );
}
