import { FieldProps } from "../editor-single-field";
import ReferenceInput from "@/components/ui/reference-input";
import SingleFieldLabel from "./single-field-label";
import { useEffect } from "react";

function ReferenceField({
  zodKey,
  schemaField,
  register,
  setValue,
  getValues,
  disabled,
}: FieldProps) {
  const value = getValues(zodKey + ".$reference");

  useEffect(() => {
    if (disabled === true) {
      setValue(zodKey + ".$reference", undefined);
    }
  }, [disabled, setValue, zodKey]);

  return (
    <div className="space-y-2">
      <SingleFieldLabel
        title={schemaField.title}
        description={schemaField.description}
        zodKey={zodKey}
      />
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
    </div>
  );
}

export default ReferenceField;
