// import {
//   FormControl,
//   FormField,
//   FormItem,
//   // FormMessage,
// } from "@/components/ui/form";

import { TableSingleFieldType } from "../table-single-field";
import ReferenceInput from "@/components/ui/reference-input";
//import { useAppSelectorWithParams } from "@/hooks/hooks";
//import { selectProjectStructureBySufix } from "@/API/project-api/project-api.slice";

function TableReferenceField({
  zodKey,
  // control,
  // disabled,
  schemaField,
  getValues,
  register,
  setValue,
}: TableSingleFieldType) {
  const value = getValues(zodKey + ".$reference");

  return (
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
  );
}

TableReferenceField.displayName = "TableReferenceField";

export default TableReferenceField;

/*
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
*/
