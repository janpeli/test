import { Button } from "@/components/ui/button";

export function RailMenuItem({
  desc,
  icon,
  active,
  onClick,
}: {
  desc: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li className="w-16 flex items-center justify-center" role="menuitem">
      <Button
        variant={"ghost"}
        onClick={onClick}
        className="h-16 p-0 focus:bg-accent"
      >
        <div
          className={`flex flex-col flex-none h-16 w-16 items-center justify-center  border-l-4  ${
            active ? " border-accent" : "  border-transparent "
          }`}

          ///hover:bg-accent hover:text-accent-foreground cursor-pointer
        >
          {icon}
          <span className="text-xs">{desc}</span>
        </div>
      </Button>
    </li>
  );
}
