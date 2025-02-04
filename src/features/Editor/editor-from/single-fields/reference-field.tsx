import EditorFormTooltip from "../editor-form-tooltip";
import { FieldProps } from "../editor-single-field";
import ReferenceInput from "@/components/ui/reference-input";

import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";

function ReferenceField({ zodKey, schemaField }: FieldProps) {
  const { register, setValue, getValues } = useFormContext();
  const value = getValues(zodKey + ".$reference");

  return (
    <div className="space-y-2">
      <Label htmlFor={zodKey}>
        <EditorFormTooltip tooltip={schemaField.description || ""}>
          <span>{schemaField.title || zodKey}</span>
        </EditorFormTooltip>
      </Label>
      <ReferenceInput
        {...register(zodKey + ".$reference")}
        onChange={(value) => setValue(zodKey + ".$reference", value)}
        value={value}
        allowMultiselect={true}
        sufix={
          schemaField.properties &&
          "$reference" in schemaField.properties &&
          schemaField.properties.$reference &&
          schemaField.properties.$reference.sufix
            ? schemaField.properties.$reference.sufix
            : []
        }
      />
    </div>
  );
}

export default ReferenceField;

/*
 <FormItem>
            <FormLabel>
              <EditorFormTooltip tooltip={schemaField.description || ""}>
                <span>{schemaField.title || zodKey}</span>
              </EditorFormTooltip>
            </FormLabel>
            <FormControl>
              <ReferenceInput
                onChange={(v) => field.onChange({ $reference: v })}
                disabled={field.disabled ? true : false}
                value={
                  field.value &&
                  typeof field.value === "object" &&
                  "$reference" in field.value
                    ? field.value["$reference"]
                    : ""
                }
                projectStructure={
                  projectStructure ? projectStructure : undefined
                }
                allowMultiselect={true}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
*/
