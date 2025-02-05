// import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TableSingleFieldType } from "../table-single-field";
import { useEffect } from "react";

function TableStringField({
  zodKey,
  schemaField,
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
  const isEmail = schemaField.format === "email";
  return <Input type={isEmail ? "email" : ""} placeholder="..." {...field} />;
}

TableStringField.displayName = "TableStringField";

export default TableStringField;
