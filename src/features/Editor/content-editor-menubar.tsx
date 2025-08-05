import { saveEditedFile } from "@/API/editor-api/editor-api";
import { selectOpenFile } from "@/API/editor-api/editor-api.selectors";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import { Save } from "lucide-react";
import { EditorMode } from "@/API/editor-api/editor-api.slice";
//import { Switch } from "@/components/ui/switch"; // Assuming a Switch component for checkbox
//import { Label } from "@/components/ui/label"; // Assuming a Label component for the switch

type ContentEditorMenubarProps = {
  currentMode: EditorMode;
  setMode: (mode: EditorMode) => void;
  editorIdx: number;
  /*showMonacoInMarkdownMode: boolean; // New prop
  setShowMonacoInMarkdownMode: (show: boolean) => void; // New prop*/
};

function ContentEditorMenubar(props: ContentEditorMenubarProps) {
  const openFile = useAppSelectorWithParams(selectOpenFile, {
    editorIdx: props.editorIdx,
  });

  const isMarkdownFile =
    openFile?.sufix?.toLowerCase() === "md" ||
    openFile?.sufix?.toLowerCase() === "markdown";

  // Dynamically determine modes based on file type
  const modes: EditorMode[] = isMarkdownFile ? ["MARKDOWN"] : ["YAML", "FORM"];

  return (
    <div className="flex flex-row justify-start h-8 border-b items-center gap-1 p-1">
      {/* Mode Toggle Group */}
      <ToggleGroup
        variant="outline"
        className="inline-flex gap-0 -space-x-px rounded-lg shadow-sm shadow-black/5 rtl:space-x-reverse pl-1"
        type="single"
        value={props.currentMode} // Use the current mode from props
        onValueChange={(value) => {
          if (
            value &&
            (value === "YAML" || value === "FORM" || value === "MARKDOWN")
          ) {
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

      {/* Markdown Monaco Visibility Toggle */}
      {/* {props.currentMode === "MARKDOWN" && isMarkdownFile && (
        <div className="flex items-center space-x-2 ml-4">
          <Label
            htmlFor="show-monaco-markdown"
            className="text-sm font-medium leading-none"
          >
            Show Editor
          </Label>
          <Switch
            id="show-monaco-markdown"
            checked={props.showMonacoInMarkdownMode}
            onCheckedChange={props.setShowMonacoInMarkdownMode}
          />
        </div>
      )} */}

      {/* Save Button */}
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
