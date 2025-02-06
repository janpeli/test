import { FieldProps } from "../editor-single-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

function BooleanField({
  zodKey,
  schemaField,
  register,
  setValue,
  getValues,
  disabled,
}: FieldProps) {
  const [isChecked, setIsChecked] = useState<boolean>(getValues(zodKey));
  const field = register(zodKey, { disabled: disabled });

  useEffect(() => {
    if (disabled === true && isChecked) {
      setValue(zodKey, undefined);
      setIsChecked(false);
    }
  }, [disabled, setValue, zodKey, isChecked]);

  return (
    <div className="flex flex-row space-x-3 space-y-0 rounded-md border p-4 shadow items-center">
      <Checkbox
        checked={isChecked}
        onCheckedChange={(value) => {
          setValue(zodKey, value);
          setIsChecked(value ? true : false);
        }}
        {...field}
      />

      <div className="space-y-1 leading-none">
        <Label htmlFor={zodKey}>
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
