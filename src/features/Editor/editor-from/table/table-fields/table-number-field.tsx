import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { FormFieldProps } from "../../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";

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

  useEffect(() => {
    if (disabled === true) {
      setValue(zodKey, undefined);
      updateEditorFormDatabyPath(fileId, getValues(), zodKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  return <Input type="number" {...field} />;
}

TableNumberField.displayName = "TableNumberField";

export default TableNumberField;
