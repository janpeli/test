//import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { FormFieldProps } from "../../render-form-field";

function TableIntegerfield({
  zodKey,
  /* control,*/
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

  return <Input type="number" step="1" pattern="\d+" {...field} />;
}

TableIntegerfield.displayName = "TableIntegerfield";

export default TableIntegerfield;
