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
    <li className="w-20 flex items-center justify-center" role="menuitem">
      <Button
        variant={"ghost"}
        onClick={onClick}
        className="h-16 p-0 focus:bg-accent"
      >
        <div
          className={`flex flex-col flex-none h-16 w-20 items-center justify-center  border-l-4  ${
            active ? " border-accent" : "  border-transparent "
          }`}
        >
          {icon}
          <span className="text-xs">{desc}</span>
        </div>
      </Button>
    </li>
  );
}
