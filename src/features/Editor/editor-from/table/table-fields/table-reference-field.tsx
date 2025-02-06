import { useEffect } from "react";
import { TableSingleFieldType } from "../table-single-field";
import ReferenceInput from "@/components/ui/reference-input";

function TableReferenceField({
  zodKey,
  // control,
  disabled,
  schemaField,
  getValues,
  register,
  setValue,
}: TableSingleFieldType) {
  const value = getValues(zodKey + ".$reference");

  useEffect(() => {
    if (disabled === true) {
      setValue(zodKey + ".$reference", undefined);
    }
  }, [disabled, setValue, zodKey]);

  return (
    <ReferenceInput
      {...register(zodKey + ".$reference", { disabled: disabled })}
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
