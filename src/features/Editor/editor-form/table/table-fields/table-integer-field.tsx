//import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FormFieldProps } from "../../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";
import { useClearFieldWhenDisabled } from "../../hooks";
import { inlineCellControl } from "./utils";

function TableIntegerfield({
  zodKey,
  /* control,*/
  disabled,
  register,
  setValue,
  getValues,
  fileId,
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
      step="1"
      pattern="\d+"
      className={cn(inlineCellControl, "text-right tabular-nums")}
      {...field}
    />
  );
}

TableIntegerfield.displayName = "TableIntegerfield";

export default TableIntegerfield;
