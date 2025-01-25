import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FieldProps } from "../editor-single-field";
import { Checkbox } from "@/components/ui/checkbox";

function BooleanField({ zodKey, schemaField, control }: FieldProps) {
  return (
    <FormField
      key={zodKey}
      control={control}
      name={zodKey}
      render={({ field }) => (
        <FormItem className="flex flex-row space-x-3 space-y-0 rounded-md border p-4 shadow items-center">
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>
              {schemaField.title ? schemaField.title : zodKey}
            </FormLabel>
            {schemaField.description && (
              <FormDescription>{schemaField.description}</FormDescription>
            )}
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}

BooleanField.displayName = "BooleanField";

export default BooleanField;
