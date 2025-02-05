import { FieldProps } from "../editor-single-field";
import ReferenceInput from "@/components/ui/reference-input";

import SingleFieldLabel from "./single-field-label";

function ReferenceField({
  zodKey,
  schemaField,
  register,
  setValue,
  getValues,
}: FieldProps) {
  //const { register, setValue, getValues } = useFormContext();
  const value = getValues(zodKey + ".$reference");

  return (
    <div className="space-y-2">
      <SingleFieldLabel
        title={schemaField.title}
        description={schemaField.description}
        zodKey={zodKey}
      />
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
