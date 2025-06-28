import { saveEditedFile } from "@/API/editor-api/editor-api";
import { selectOpenFile } from "@/API/editor-api/editor-api.selectors";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import { Save } from "lucide-react";
import { EditorMode } from "@/API/editor-api/editor-api.slice";

type ContentEditorMenubarProps = {
  currentMode: EditorMode;
  setMode: (mode: EditorMode) => void;
  editorIdx: number;
};

function ContentEditorMenubar(props: ContentEditorMenubarProps) {
  const modes: EditorMode[] = ["YAML", "FORM"];
  const openFile = useAppSelectorWithParams(selectOpenFile, {
    editorIdx: props.editorIdx,
  });

  return (
    <div className="flex flex-row justify-start h-8 border-b items-center gap-1 p-1">
      <ToggleGroup
        variant="outline"
        className="inline-flex gap-0 -space-x-px rounded-lg shadow-sm shadow-black/5 rtl:space-x-reverse pl-1"
        type="single"
        value={props.currentMode} // Use the current mode from props
        onValueChange={(value) => {
          if (value && (value === "YAML" || value === "FORM")) {
            props.setMode(value as EditorMode);
          }
        }}
      >
        {modes.map((mode) => {
          return (
            <ToggleGroupItem
              key={mode}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 h-6"
              value={mode}
            >
              {mode}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
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
