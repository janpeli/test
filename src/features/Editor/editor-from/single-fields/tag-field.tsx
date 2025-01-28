import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import TagInput from "@/components/ui/tag-input/tag-input";
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
              <span>{schemaField.title || zodKey}</span>
            </EditorFormTooltip>
          </FormLabel>
          <FormControl>
            <TagInput {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

TagField.displayName = "TagField";

export default TagField;
