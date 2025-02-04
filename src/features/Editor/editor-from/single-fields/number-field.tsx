import { FieldProps } from "../editor-single-field";
import { Input } from "@/components/ui/input";
import EditorFormTooltip from "../editor-form-tooltip";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";

function NumberField({ zodKey, schemaField }: FieldProps) {
  const { register } = useFormContext();
  const field = register(zodKey);
  return (
    <div className="space-y-2">
      <Label htmlFor={zodKey}>
        <EditorFormTooltip tooltip={schemaField.description || ""}>
          <span>{schemaField.title || zodKey}</span>
        </EditorFormTooltip>
      </Label>
      <Input type="number" {...field} />
    </div>
  );
}

NumberField.displayName = "NumberField";

export default NumberField;

/*
    <FormField
      key={zodKey}
      name={zodKey}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            <EditorFormTooltip tooltip={schemaField.description || ""}>
              <span>{schemaField.title ? schemaField.title : zodKey}</span>
            </EditorFormTooltip>
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
*/
