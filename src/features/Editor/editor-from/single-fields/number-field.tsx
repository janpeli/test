import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FieldProps } from "../editor-single-field";
import { Input } from "@/components/ui/input";

function NumberField({ zodKey, schemaField, control }: FieldProps) {
  return (
    <FormField
      key={zodKey}
      control={control}
      name={zodKey}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {schemaField.title ? schemaField.title : zodKey}
          </FormLabel>
          <FormControl>
            <Input type="number" {...field} />
          </FormControl>
          {schemaField.description && (
            <FormDescription>{schemaField.description}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

NumberField.displayName = "NumberField";

export default NumberField;
