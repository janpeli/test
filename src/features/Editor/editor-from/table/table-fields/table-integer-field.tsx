//import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { FormFieldProps } from "../../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";

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

  useEffect(() => {
    if (disabled === true) {
      setValue(zodKey, undefined);
      updateEditorFormDatabyPath(fileId, getValues(), zodKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  return <Input type="number" step="1" pattern="\d+" {...field} />;
}

TableIntegerfield.displayName = "TableIntegerfield";

export default TableIntegerfield;
