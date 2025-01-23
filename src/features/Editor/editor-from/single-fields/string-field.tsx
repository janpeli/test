import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { FieldProps } from "../editor-single-field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function StringField({ zodKey, schemaField, control }: FieldProps) {
  return (
    <FormField
      key={zodKey}
      control={control}
      name={zodKey}
      render={({ field }) => (
        <FormItem className={cn(schemaField.format === "text" && "col-span-2")}>
          <FormLabel>
            {schemaField.title ? schemaField.title : zodKey}
          </FormLabel>
          <FormControl>
            {schemaField.format === "text" ? (
              <Textarea placeholder=".." />
            ) : (
              <Input placeholder="..." {...field} />
            )}
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

StringField.displayName = "StringField";

export default StringField;
