import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Select, SelectItem } from "@/components/ui/basic-select";
import { FormFieldProps } from "../../render-form-field";

function TableSelectField({
  zodKey,
  schemaField,
  control,
  disabled,
}: FormFieldProps) {
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
              {schemaField.enum && <SelectItems items={schemaField.enum} />}
            </Select>
          </FormControl>
        </FormItem>
      )}
    />
  );
}

function SelectItems({ items }: { items: (string | number)[] }) {
  return (
    <div>
      {items.map((item) => (
        <SelectItem
          value={typeof item === "number" ? item.toString() : item}
          key={item}
        >
          {item}
        </SelectItem>
      ))}
    </div>
  );
}

TableSelectField.displayName = "TableSelectField";
export default TableSelectField;
