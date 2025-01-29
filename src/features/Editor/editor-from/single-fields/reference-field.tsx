import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import EditorFormTooltip from "../editor-form-tooltip";
import { FieldProps } from "../editor-single-field";
import ReferenceInput from "@/components/ui/reference-input";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import { selectProjectStructureBySufix } from "@/API/project-api/project-api.slice";

function ReferenceField({ zodKey, schemaField, control }: FieldProps) {
  const projectStructure = useAppSelectorWithParams(
    selectProjectStructureBySufix,
    {
      sufix:
        schemaField.properties &&
        schemaField.properties.$reference &&
        schemaField.properties.$reference.sufix
          ? schemaField.properties.$reference.sufix
          : [],
    }
  );
  return (
    <FormField
      key={zodKey}
      control={control}
      name={zodKey}
      render={({ field }) => {
        console.log(field);
        return (
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
                value={field.value["$reference"]}
                projectStructure={
                  projectStructure ? projectStructure : undefined
                }
                allowMultiselect={true}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

export default ReferenceField;
