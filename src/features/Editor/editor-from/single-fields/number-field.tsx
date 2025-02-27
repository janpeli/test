import { Input } from "@/components/ui/input";
import SingleFieldLabel from "./single-field-label";
import { useEffect } from "react";
import { FormFieldProps } from "../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";

function NumberField({
  zodKey,
  schemaField,
  register,
  disabled,
  setValue,
  fileId,
  getValues,
  control,
}: FormFieldProps) {
  const field = register(zodKey, {
    disabled: disabled,
    onBlur: () => {
      updateEditorFormDatabyPath(fileId, getValues(), zodKey);
    },
  });

  useEffect(() => {
    if (disabled === true) {
      setValue(zodKey, undefined);
      updateEditorFormDatabyPath(fileId, getValues(), zodKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);
  return (
    <div className="space-y-2">
      <SingleFieldLabel
        title={schemaField.title}
        description={schemaField.description}
        zodKey={zodKey}
        control={control}
      />
      <Input type="number" {...field} />
    </div>
  );
}

NumberField.displayName = "NumberField";

export default NumberField;
