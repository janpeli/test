import { useAppSelector } from "@/hooks/hooks";
import { selectEditorsLength } from "@/API/editor-api/editor-api.selectors";
import Editor from "../Editor/editor";
import StatusPanel from "../StatusPanel/status-panel";
import { selectProjectName } from "@/API/project-api/project-api.selectors";
import { Kbd } from "@/components/ui/kbd";
import { getShortcut } from "@/lib/shortcuts/registry";
import { chordKeyLabels } from "@/lib/shortcuts/shortcuts.core";
import { isMac } from "@/lib/shortcuts/use-global-shortcuts";

function ShortcutRow({ id }: { id: string }) {
  const shortcut = getShortcut(id);
  if (!shortcut) return null;

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-8">
      <span>{shortcut.label}</span>
      <span className="flex items-center gap-1 justify-self-end">
        {chordKeyLabels(shortcut.chord, isMac).map((key, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-xs">+</span>}
            <Kbd>{key}</Kbd>
          </span>
        ))}
      </span>
    </div>
  );
}

export default function ContentArea() {
  const numberOfEditors = useAppSelector(selectEditorsLength);
  const projectName = useAppSelector(selectProjectName);

  const shortcutIds = projectName
    ? ["view.commandPalette", "project.close"]
    : ["view.commandPalette", "project.open", "project.new"];

  return (
    <main className="flex-1 bg-muted flex flex-col overflow-hidden">
      {numberOfEditors ? (
        <Editor />
      ) : (
        <div className="text-muted-foreground flex-1 flex flex-col justify-center items-center">
          <div className="flex flex-col gap-2">
            {shortcutIds.map((id) => (
              <ShortcutRow key={id} id={id} />
            ))}
          </div>
        </div>
      )}
      <StatusPanel />
    </main>
  );
}
