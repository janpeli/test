import {
  FormControl,
  FormField,
  FormItem,
  // FormMessage,
} from "@/components/ui/form";

import { TableSingleFieldType } from "../table-single-field";
import ReferenceInput from "@/components/ui/reference-input";
//import { useAppSelectorWithParams } from "@/hooks/hooks";
//import { selectProjectStructureBySufix } from "@/API/project-api/project-api.slice";

function TableReferenceField({
  zodKey,
  control,
  disabled,
  schemaField,
}: TableSingleFieldType) {
  /*  const projectStructure = useAppSelectorWithParams(
    selectProjectStructureBySufix,
    {
      sufix:
        schemaField.properties &&
        "$reference" in schemaField.properties &&
        schemaField.properties.$reference &&
        schemaField.properties.$reference.sufix
          ? schemaField.properties.$reference.sufix
          : [],
    }
  );
*/

  return (
    <FormField
      key={zodKey}
      control={control}
      name={zodKey}
      disabled={disabled}
      render={({ field }) => {
        //console.log(field);
        const onChangeHandler = (v: string | string[]) => {
          //field.onChange({ $reference: v });
          console.log(v);
        };
        return (
          <FormItem>
            <FormControl>
              <ReferenceInput
                onChange={onChangeHandler}
                disabled={field.disabled ? true : false}
                value={
                  field.value &&
                  typeof field.value === "object" &&
                  "$reference" in field.value
                    ? field.value["$reference"]
                    : ""
                }
                sufix={
                  schemaField.properties &&
                  "$reference" in schemaField.properties &&
                  schemaField.properties.$reference &&
                  schemaField.properties.$reference.sufix
                    ? schemaField.properties.$reference.sufix
                    : []
                }
                allowMultiselect={true}
              />
            </FormControl>
          </FormItem>
        );
      }}
    />
  );
}

TableReferenceField.displayName = "TableReferenceField";

export default TableReferenceField;
