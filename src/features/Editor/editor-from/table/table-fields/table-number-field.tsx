// import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TableSingleFieldType } from "../table-single-field";

function TableNumberField({
  zodKey,
  // control,
  // disabled,
  register,
}: TableSingleFieldType) {
  const field = register(zodKey);
  return <Input type="number" {...field} />;
}

TableNumberField.displayName = "TableNumberField";

export default TableNumberField;
