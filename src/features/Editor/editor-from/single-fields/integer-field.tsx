import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FieldProps } from "../editor-single-field";

function IntegerField({ zodKey, schemaField, control }: FieldProps) {
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
            <Input type="number" step="1" pattern="\d+" {...field} />
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

IntegerField.displayName = "IntegerField";

export default IntegerField;
