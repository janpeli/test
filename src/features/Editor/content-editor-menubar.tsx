import { saveEditedFile, toggleFileView } from "@/API/editor-api/editor-api";
import {
  selectOpenFile,
  selectOpenFileActiveViews,
} from "@/API/editor-api/editor-api.selectors";
import { EditorModeType } from "@/API/editor-api/editor-api.slice";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import { Save } from "lucide-react";

type ContentEditorMenubarProps = {
  editorIdx: number;
};

function ContentEditorMenubar({ editorIdx }: ContentEditorMenubarProps) {
  const openFile = useAppSelectorWithParams(selectOpenFile, { editorIdx });
  const activeViews =
    useAppSelectorWithParams(selectOpenFileActiveViews, { editorIdx }) ?? [];

  const availableModes: EditorModeType[] = openFile?.modes ?? [];

  const handleToggle = (view: EditorModeType) => {
    if (!openFile) return;
    toggleFileView(openFile.id, view);
  };

  return (
    <div className="flex flex-row justify-start h-8 border-b items-center gap-1 p-1">
      <div className="inline-flex gap-0 -space-x-px rounded-lg shadow-sm shadow-black/5 rtl:space-x-reverse pl-1">
        {availableModes.map((mode) => (
          <Toggle
            key={mode}
            variant="outline"
            size="sm"
            className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 h-6 px-2 text-xs"
            pressed={activeViews.includes(mode)}
            onPressedChange={() => handleToggle(mode)}
          >
            {mode}
          </Toggle>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={async () => {
          await saveEditedFile(openFile?.id as string);
        }}
      >
        <Save className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Save file</span>
      </Button>
    </div>
  );
}

export default ContentEditorMenubar;
