import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { FieldProps } from "../editor-single-field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import EditorFormTooltip from "../editor-form-tooltip";

function StringField({ zodKey, schemaField, control }: FieldProps) {
  return (
    <FormField
      key={zodKey}
      control={control}
      name={zodKey}
      render={({ field }) => (
        <FormItem className={cn(schemaField.format === "text" && "col-span-2")}>
          <FormLabel>
            <EditorFormTooltip tooltip={schemaField.description || ""}>
              <span>{schemaField.title ? schemaField.title : zodKey}</span>
            </EditorFormTooltip>
          </FormLabel>
          <FormControl>
            {schemaField.format === "text" ? (
              <Textarea
                placeholder={
                  schemaField.description ? schemaField.description : ".."
                }
                {...field}
              />
            ) : (
              <Input placeholder="..." {...field} />
            )}
          </FormControl>
          {/*schemaField.description && (
            <FormDescription>{schemaField.description}</FormDescription>
          )*/}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

StringField.displayName = "StringField";

export default StringField;
