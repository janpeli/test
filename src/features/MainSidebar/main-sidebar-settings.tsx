import { Monitor, Moon, Sun } from "lucide-react";

import { useAppSelector } from "@/hooks/hooks";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { setTheme } from "@/API/GUI-api/theme-api";
import { selectTheme, Theme } from "@/API/GUI-api/theme.slice";

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
  { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
  { value: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
];

function MainSidebarSettings() {
  const theme = useAppSelector(selectTheme);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-2 pt-1 flex-none h-7">
        <span>SETTINGS</span>
      </div>
      <Separator className="my-2" />
      <div className="flex flex-col gap-4 px-2 overflow-y-auto">
        <section className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Appearance
          </span>
          <div className="flex gap-1">
            {themeOptions.map((option) => (
              <Button
                key={option.value}
                variant={theme === option.value ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "flex-1 flex-col h-auto gap-1 py-2",
                  theme === option.value && "ring-1 ring-ring"
                )}
                onClick={() => setTheme(option.value)}
              >
                {option.icon}
                <span className="text-xs">{option.label}</span>
              </Button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default MainSidebarSettings;
