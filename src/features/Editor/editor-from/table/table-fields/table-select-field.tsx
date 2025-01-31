import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { TableSingleFieldType } from "../table-single-field";
import { Select, SelectItem } from "@/components/ui/basic-select";

function TableSelectField({
  zodKey,
  schemaField,
  control,
  disabled,
}: TableSingleFieldType) {
  return (
    <FormField
      key={zodKey}
      control={control}
      name={zodKey}
      disabled={disabled}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              {schemaField.enum &&
                schemaField.enum.map((item) => (
                  <SelectItem
                    value={typeof item === "number" ? item.toString() : item}
                    key={item}
                  >
                    {item}
                  </SelectItem>
                ))}
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

TableSelectField.displayName = "TableSelectField";
export default TableSelectField;
