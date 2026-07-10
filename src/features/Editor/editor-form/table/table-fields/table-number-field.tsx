import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FormFieldProps } from "../../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";
import { useClearFieldWhenDisabled } from "../../hooks";
import { inlineCellControl } from "./utils";

function TableNumberField({
  zodKey,
  // control,
  disabled,
  register,
  setValue,
  fileId,
  getValues,
}: FormFieldProps) {
  const field = register(zodKey, {
    disabled: disabled,
    valueAsNumber: true,
    onBlur: () => {
      updateEditorFormDatabyPath(fileId, getValues(), zodKey);
    },
  });

  useClearFieldWhenDisabled({ disabled, fileId, zodKey, setValue, getValues });

  return (
    <Input
      type="number"
      className={cn(inlineCellControl, "text-right tabular-nums")}
      {...field}
    />
  );
}

TableNumberField.displayName = "TableNumberField";

export default TableNumberField;
