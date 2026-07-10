import { Input } from "@/components/ui/input";
import SingleFieldLabel from "./single-field-label";
import { FormFieldProps } from "../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";
import { useClearFieldWhenDisabled } from "../hooks";

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
    valueAsNumber: true,
    onBlur: () => {
      updateEditorFormDatabyPath(fileId, getValues(), zodKey);
    },
  });

  useClearFieldWhenDisabled({ disabled, fileId, zodKey, setValue, getValues });
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
