import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import {
  closeCommandPalette,
  selectCommandPaletteOpen,
} from "@/API/GUI-api/command-palette.slice";
import { store } from "@/app/store";
import { SHORTCUTS, runShortcutById, type ShortcutGroup } from "@/lib/shortcuts/registry";
import { formatChord } from "@/lib/shortcuts/shortcuts.core";
import { isMac } from "@/lib/shortcuts/use-global-shortcuts";

// Order the groups appear in the palette.
const GROUP_ORDER: ShortcutGroup[] = ["File", "Editor", "View", "Project"];

export default function CommandPalette() {
  const open = useAppSelector(selectCommandPaletteOpen);
  const dispatch = useAppDispatch();

  // Snapshot enabled shortcuts when the palette opens (re-evaluated each render,
  // which happens on open). The palette toggle itself is never listed.
  const state = store.getState();
  const available = SHORTCUTS.filter(
    (s) => s.id !== "view.commandPalette" && (!s.when || s.when(state))
  );

  const handleSelect = (id: string) => {
    dispatch(closeCommandPalette());
    // Defer so the palette dialog finishes closing (and restores focus) before
    // a shortcut that opens another dialog/modal runs.
    setTimeout(() => runShortcutById(id), 0);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dispatch(closeCommandPalette());
      }}
    >
      <CommandInput placeholder="Type a command…" />
      <CommandList>
        <CommandEmpty>No matching commands.</CommandEmpty>
        {GROUP_ORDER.map((group, idx) => {
          const items = available.filter((s) => s.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {items.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={`${s.label} ${s.id}`}
                    onSelect={() => handleSelect(s.id)}
                  >
                    {s.label}
                    <CommandShortcut>
                      {formatChord(s.chord, isMac)}
                    </CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
