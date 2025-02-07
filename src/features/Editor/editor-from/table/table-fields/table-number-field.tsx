import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { FormFieldProps } from "../../render-form-field";

function TableNumberField({
  zodKey,
  // control,
  disabled,
  register,
  setValue,
}: FormFieldProps) {
  const field = register(zodKey, { disabled: disabled });

  useEffect(() => {
    if (disabled === true) {
      setValue(zodKey, undefined);
    }
  }, [disabled, setValue, zodKey]);

  return <Input type="number" {...field} />;
}

TableNumberField.displayName = "TableNumberField";

export default TableNumberField;
