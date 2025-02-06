import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    title: string;
  }[];
  defaultItem: string;
}

export function SidebarNav({
  className,
  items,
  defaultItem,
  ...props
}: SidebarNavProps) {
  const [ActiveItem, setActiveItem] = useState(defaultItem);

  return (
    <nav className={cn("flex space-x-2", className)} {...props}>
      {items.map((item) => (
        <Button
          key={item.title}
          variant={"ghost"}
          size={"sm"}
          className={cn(
            ActiveItem === item.title
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline",
            "justify-start"
          )}
          onClick={() => {
            setActiveItem(item.title);
          }}
        >
          {item.title}
        </Button>
      ))}
    </nav>
  );
}
