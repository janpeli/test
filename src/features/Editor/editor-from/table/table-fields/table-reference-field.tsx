import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { TableSingleFieldType } from "../table-single-field";
import ReferenceInput from "@/components/ui/reference-input";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import { selectProjectStructureBySufix } from "@/API/project-api/project-api.slice";

function TableReferenceField({
  zodKey,
  control,
  disabled,
  schemaField,
}: TableSingleFieldType) {
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
      disabled={disabled}
      render={({ field }) => {
        console.log(field);
        return (
          <FormItem>
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

export default TableReferenceField;
