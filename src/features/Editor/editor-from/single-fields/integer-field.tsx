import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import SingleFieldLabel from "./single-field-label";
import { FormFieldProps } from "../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";

function IntegerField({
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
    valueAsNumber: true,
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
      <Input type="number" step="1" pattern="\d+" {...field} />
    </div>
  );
}

IntegerField.displayName = "IntegerField";

export default IntegerField;
