import { Textarea } from "@/components/ui/textarea";
import { FieldProps } from "../editor-single-field";
import { Input } from "@/components/ui/input";
import EditorFormTooltip from "../editor-form-tooltip";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";

function StringField({ zodKey, schemaField }: FieldProps) {
  const { register } = useFormContext();
  const field = register(zodKey);
  return (
    <div className="space-y-2">
      <Label htmlFor={zodKey}>
        <EditorFormTooltip tooltip={schemaField.description || ""}>
          <span>{schemaField.title || zodKey}</span>
        </EditorFormTooltip>
      </Label>
      {schemaField.format === "text" ? (
        <Textarea
          placeholder={schemaField.description ? schemaField.description : ".."}
          {...field}
        />
      ) : (
        <Input placeholder="..." {...field} />
      )}
    </div>
  );
}

StringField.displayName = "StringField";

export default StringField; /* }

/*
 <FormField
      key={zodKey}
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
          )*/
/*
       <FormMessage />
        </FormItem>
*/
