//import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TableSingleFieldType } from "../table-single-field";

function TableIntegerfield({
  zodKey,
  /* control,
  disabled,*/
  register,
}: TableSingleFieldType) {
  const field = register(zodKey);
  return <Input type="number" step="1" pattern="\d+" {...field} />;
}

TableIntegerfield.displayName = "TableIntegerfield";

export default TableIntegerfield;
