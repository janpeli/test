// import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TableSingleFieldType } from "../table-single-field";
import { useEffect } from "react";

function TableNumberField({
  zodKey,
  // control,
  disabled,
  register,
  setValue,
}: TableSingleFieldType) {
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
