import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import TagInput from "@/components/ui/tag-input";
import { FieldProps } from "../editor-single-field";
import EditorFormTooltip from "../editor-form-tooltip";

function TagField({ zodKey, schemaField, control }: FieldProps) {
  return (
    <FormField
      key={zodKey}
      control={control}
      name={zodKey}
      render={({ field }) => (
        <FormItem className="col-span-2">
          <FormLabel>
            <EditorFormTooltip tooltip={schemaField.description || ""}>
              <span>{schemaField.title ? schemaField.title : zodKey}</span>
            </EditorFormTooltip>
          </FormLabel>
          <FormControl>
            <TagInput {...field} />
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

TagField.displayName = "TagField";

export default TagField;
