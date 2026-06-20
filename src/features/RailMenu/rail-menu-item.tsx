import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <li className="w-full flex items-center justify-center" role="menuitem">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "h-[52px] w-full flex flex-col items-center justify-center gap-1 select-none outline-none transition-colors",
              active
                ? "bg-sidebar-accent text-primary shadow-[inset_2px_0_0_hsl(var(--primary))]"
                : "text-muted-foreground hover:text-foreground focus-visible:text-foreground"
            )}
          >
            {icon}
            <span className="text-[9px] uppercase tracking-wide">{desc}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{desc}</TooltipContent>
      </Tooltip>
    </li>
  );
}
