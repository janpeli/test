import { Label } from "@/components/ui/label";
import EditorFormTooltip from "../editor-form-tooltip";

type SingleFieldLabelType = {
  zodKey: string;
  description?: string;
  title?: string;
};

function SingleFieldLabel({
  zodKey,
  description,
  title,
}: SingleFieldLabelType) {
  return (
    <Label htmlFor={zodKey}>
      {description ? (
        <EditorFormTooltip tooltip={description || ""}>
          <span>{title || zodKey}</span>
        </EditorFormTooltip>
      ) : (
        <span>{title || zodKey}</span>
      )}
    </Label>
  );
}

SingleFieldLabel.displayName = "SingleFieldLabel";
export default SingleFieldLabel;
