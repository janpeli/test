import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { FormFieldProps } from "../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";

function BooleanField({
  zodKey,
  schemaField,
  register,
  setValue,
  getValues,
  disabled,
  fileId,
}: FormFieldProps) {
  const [isChecked, setIsChecked] = useState<boolean>(
    Boolean(getValues(zodKey))
  );
  const field = register(zodKey, {
    disabled: disabled,
    setValueAs: (v) => Boolean(v),
  });

  useEffect(() => {
    if (disabled === true && isChecked) {
      setValue(zodKey, false); // Set to false instead of undefined
      setIsChecked(false);
      updateEditorFormDatabyPath(fileId, getValues(), zodKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  return (
    <div className="flex flex-row space-x-3 space-y-0 rounded-md border p-4 shadow items-center">
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
      <div className="space-y-1 leading-none">
        <Label htmlFor={zodKey} className={disabled ? "opacity-50" : ""}>
          {schemaField.title ? schemaField.title : zodKey}
        </Label>
        {schemaField.description && (
          <p className="text-[0.8rem] text-muted-foreground">
            {schemaField.description}
          </p>
        )}
      </div>
    </div>
  );
}

BooleanField.displayName = "BooleanField";
export default BooleanField;
