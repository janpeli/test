import ReferenceInput from "@/components/ui/reference-input";
import SingleFieldLabel from "./single-field-label";
import { useEffect } from "react";
import { FormFieldProps } from "../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";

function ReferenceField({
  zodKey,
  schemaField,
  register,
  setValue,
  getValues,
  disabled,
  fileId,
}: FormFieldProps) {
  const value = getValues(zodKey + ".$reference");

  useEffect(() => {
    if (disabled === true) {
      setValue(zodKey + ".$reference", undefined);
      updateEditorFormDatabyPath(fileId, getValues(), zodKey + ".$reference");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  const onChangeHandler = (value: string | string[]) => {
    setValue(zodKey + ".$reference", value);
    updateEditorFormDatabyPath(fileId, getValues(), zodKey + ".$reference");
  };

  return (
    <div className="space-y-2">
      <SingleFieldLabel
        title={schemaField.title}
        description={schemaField.description}
        zodKey={zodKey}
      />
      <ReferenceInput
        {...register(zodKey + ".$reference", { disabled: disabled })}
        onChange={onChangeHandler}
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
