import { selectOpenFile } from "@/API/editor-api/editor-api.selectors";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import { Save } from "lucide-react";

type ContentEditorMenubarProps = {
  setMode: React.Dispatch<React.SetStateAction<string>>;
  editorIdx: number;
};

function ContentEditorMenubar(props: ContentEditorMenubarProps) {
  const modes = ["YAML", "FORM"];
  const openFile = useAppSelectorWithParams(selectOpenFile, {
    editorIdx: props.editorIdx,
  });

  return (
    <div className="flex flex-row justify-start h-7 border-b items-center gap-1">
      <ToggleGroup
        variant="outline"
        className="inline-flex gap-0 -space-x-px rounded-lg shadow-sm shadow-black/5 rtl:space-x-reverse "
        type="single"
        defaultValue={modes[0]}
        onValueChange={(value) => props.setMode(value)}
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
      <Button variant="outline" className="h-6">
        <Save className="h-4" /> Save
      </Button>
      <span className="text-xs text-muted">{openFile?.id}</span>
    </div>
  );
}

export default ContentEditorMenubar;

/*
// Dependencies: pnpm install @radix-ui/react-toggle-group

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function ButtonDemo() {
  return (
    <ToggleGroup
      variant="outline"
      className="inline-flex gap-0 -space-x-px rounded-lg shadow-sm shadow-black/5 rtl:space-x-reverse"
      type="single"
    >
      <ToggleGroupItem
        className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
        value="left"
      >
        Left
      </ToggleGroupItem>
      <ToggleGroupItem
        className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
        value="center"
      >
        Center
      </ToggleGroupItem>
      <ToggleGroupItem
        className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
        value="right"
      >
        Right
      </ToggleGroupItem>
    </ToggleGroup>
  );
}


*/
