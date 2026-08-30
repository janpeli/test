import { createCanvasFromModal } from "@/API/GUI-api/modal-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CANVAS_SUFFIX_OPTIONS,
  CanvasSuffixKind,
  DEFAULT_CANVAS_SUFFIX_KIND,
} from "@/lib/canvas/canvas-suffix-options";
import { BarChart2 } from "lucide-react";
import { useState } from "react";
import CreateFileModal from "./create-file-modal";

function ModalCreateNewCanvas() {
  const [suffixKind, setSuffixKind] = useState<CanvasSuffixKind>(
    DEFAULT_CANVAS_SUFFIX_KIND
  );
  const selectedSuffixLabel =
    CANVAS_SUFFIX_OPTIONS.find((o) => o.kind === suffixKind)?.label ?? "";

  return (
    <CreateFileModal
      icon={BarChart2}
      title="Create New Canvas File"
      description={`Enter a name for your new Mermaid canvas file (${selectedSuffixLabel} will be appended)`}
      inputId="canvas-file-name"
      placeholder="my-diagram"
      failureMessage="Failed to create canvas file. Please try again."
      onCreate={(name) => createCanvasFromModal(name, suffixKind)}
      inputExtra={
        <Select
          value={suffixKind}
          onValueChange={(value) => setSuffixKind(value as CanvasSuffixKind)}
        >
          <SelectTrigger id="canvas-file-suffix" className="w-[140px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CANVAS_SUFFIX_OPTIONS.map((option) => (
              <SelectItem key={option.kind} value={option.kind}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    />
  );
}

export default ModalCreateNewCanvas;
