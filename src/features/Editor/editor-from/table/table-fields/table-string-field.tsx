// import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TableSingleFieldType } from "../table-single-field";

function TableStringField({
  zodKey,
  schemaField,
  // control,
  // disabled,
  register,
}: TableSingleFieldType) {
  const field = register(zodKey);
  const isEmail = schemaField.format === "email";
  return <Input type={isEmail ? "email" : ""} placeholder="..." {...field} />;
}

TableStringField.displayName = "TableStringField";

export default TableStringField;
