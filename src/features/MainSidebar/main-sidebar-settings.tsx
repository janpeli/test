import { Monitor, Moon, Sun, Type } from "lucide-react";

import { useAppSelector } from "@/hooks/hooks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { setTheme } from "@/API/GUI-api/theme-api";
import { selectTheme, Theme } from "@/API/GUI-api/theme.slice";
import { setFont } from "@/API/GUI-api/font-api";
import { AppFont, selectFont } from "@/API/GUI-api/font.slice";

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
  { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
  { value: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
];

const fontOptions: { value: AppFont; label: string; sample: string }[] = [
  { value: "inter", label: "Inter", sample: "Inter · JetBrains Mono" },
  { value: "plex", label: "IBM Plex", sample: "IBM Plex Sans · Mono" },
];

function MainSidebarSettings() {
  const theme = useAppSelector(selectTheme);
  const font = useAppSelector(selectFont);

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-sidebar text-sidebar-foreground">
      <div className="h-7 flex-none flex items-center px-2.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">
          SETTINGS
        </span>
      </div>
      <div className="flex flex-col gap-5 px-2.5 py-3 overflow-y-auto">
        <section className="flex flex-col gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-faint">
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

        <section className="flex flex-col gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-faint">
            Font
          </span>
          <div className="flex flex-col gap-1">
            {fontOptions.map((option) => (
              <Button
                key={option.value}
                variant={font === option.value ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "justify-start gap-2 h-auto py-2",
                  font === option.value && "ring-1 ring-ring"
                )}
                onClick={() => setFont(option.value)}
              >
                <Type className="h-4 w-4 shrink-0 text-faint" />
                <span className="flex flex-col items-start leading-tight">
                  <span className="text-xs">{option.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {option.sample}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default MainSidebarSettings;
