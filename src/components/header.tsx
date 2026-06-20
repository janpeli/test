import { ThemePicker } from "@/features/ThemePicker/theme-picker";
import HeaderMenu from "@/features/HeaderMenu/header-menu";
import { useAppSelector } from "@/hooks/hooks";
import { selectActiveOpenFileName } from "@/API/editor-api/editor-api.selectors";

export default function Header() {
  const activeFileName = useAppSelector(selectActiveOpenFileName);

  return (
    <header className="flex flex-row items-center justify-between h-8 px-2 border-b border-border bg-background flex-shrink-0">
      <div className="flex flex-row items-center gap-1 min-w-0">
        <span className="text-[11px] font-semibold tracking-[0.04em] text-primary pr-2 select-none">
          MODELER
        </span>
        <HeaderMenu />
      </div>
      <div className="flex flex-row items-center gap-2 min-w-0">
        {activeFileName && (
          <span className="font-mono text-[11px] text-faint truncate max-w-[40vw]">
            {activeFileName}
          </span>
        )}
        <ThemePicker />
      </div>
    </header>
  );
}
