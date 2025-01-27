import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TableSingleFieldType } from "../table-single-field";

function TableStringField({
  zodKey,
  schemaField,
  control,
  disabled,
}: TableSingleFieldType) {
  const isEmail = schemaField.format === "email";
  return (
    <FormField
      key={zodKey}
      control={control}
      name={zodKey}
      disabled={disabled}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input type={isEmail ? "email" : ""} placeholder="..." {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

TableStringField.displayName = "TableStringField";

export default TableStringField;
