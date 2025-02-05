import TagInput from "@/components/ui/tag-input/tag-input";
import { FieldProps } from "../editor-single-field";
import EditorFormTooltip from "../editor-form-tooltip";
//import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";

function TagField({ zodKey, schemaField, register, setValue }: FieldProps) {
  // const { register, setValue } = useFormContext();
  const { name, ref } = register(zodKey);

  return (
    <div className="space-y-2">
      <Label htmlFor={zodKey}>
        <EditorFormTooltip tooltip={schemaField.description || ""}>
          <span>{schemaField.title || zodKey}</span>
        </EditorFormTooltip>
      </Label>
      <TagInput
        name={name}
        ref={ref}
        onChange={(value) => setValue(zodKey, value)}
      />
    </div>
  );
}

TagField.displayName = "TagField";

export default TagField;

/*
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
    />*/
