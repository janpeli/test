import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { FormFieldProps } from "../../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";
import { useClearWhenDisabled } from "../../hooks";

function TableBooleanField({
  zodKey,
  /* control,*/
  disabled,
  register,
  getValues,
  setValue,
  fileId,
}: FormFieldProps) {
  const [isChecked, setIsChecked] = useState<boolean>(
    Boolean(getValues(zodKey))
  );
  const field = register(zodKey, {
    disabled: disabled,
    setValueAs: (v) => Boolean(v),
  });

  useClearWhenDisabled(disabled, fileId, () => {
    if (isChecked) {
      setValue(zodKey, false); // Set to false instead of undefined
      setIsChecked(false);
      updateEditorFormDatabyPath(fileId, getValues(), zodKey);
    }
  });

  return (
    <div className="flex h-8 items-center justify-center">
      <Checkbox
        checked={isChecked}
        onCheckedChange={(value) => {
          // Ensure we always set a boolean value
          const boolValue = Boolean(value);
          setValue(zodKey, boolValue);
          setIsChecked(boolValue);
          updateEditorFormDatabyPath(fileId, getValues(), zodKey);
        }}
        {...field}
      />
    </div>
  );
}

TableBooleanField.displayName = "TableBooleanField";
export default TableBooleanField;
