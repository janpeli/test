import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TableSingleFieldType } from "../table-single-field";

function TableNumberField({ zodKey, control, disabled }: TableSingleFieldType) {
  return (
    <FormField
      key={zodKey}
      control={control}
      name={zodKey}
      disabled={disabled}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input type="number" {...field} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

TableNumberField.displayName = "TableNumberField";

export default TableNumberField;
