import { Label } from "@/components/ui/label";
import EditorFormTooltip from "../layout/editor-form-tooltip";
import { Control, useFormState } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { getObjVal } from "@/API/editor-api/utils";

type SingleFieldLabelType = {
  zodKey: string;
  description?: string;
  title?: string;
  control: Control;
};

function SingleFieldLabel({
  zodKey,
  description,
  title,
  control,
}: SingleFieldLabelType) {
  const { errors } = useFormState({
    control,
    name: zodKey,
  });
  // Get the specific error for this field
  const fieldError = getObjVal(errors, zodKey);
  const error = fieldError?.message;
  return (
    <div className="flex items-center gap-1">
      <Label htmlFor={zodKey}>
        {description ? (
          <EditorFormTooltip tooltip={description || ""}>
            <span>{title || zodKey}</span>
          </EditorFormTooltip>
        ) : (
          <span>{title || zodKey}</span>
        )}
      </Label>
      {error && (
        <EditorFormTooltip tooltip={error}>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </EditorFormTooltip>
      )}
    </div>
  );
}

SingleFieldLabel.displayName = "SingleFieldLabel";
export default SingleFieldLabel;
