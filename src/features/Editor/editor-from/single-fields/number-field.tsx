import { Input } from "@/components/ui/input";
import SingleFieldLabel from "./single-field-label";
import { useEffect } from "react";
import { FormFieldProps } from "../render-form-field";

function NumberField({
  zodKey,
  schemaField,
  register,
  disabled,
  setValue,
}: FormFieldProps) {
  const field = register(zodKey, { disabled: disabled });

  useEffect(() => {
    if (disabled === true) {
      setValue(zodKey, undefined);
    }
  }, [disabled, setValue, zodKey]);
  return (
    <div className="space-y-2">
      <SingleFieldLabel
        title={schemaField.title}
        description={schemaField.description}
        zodKey={zodKey}
      />
      <Input type="number" {...field} />
    </div>
  );
}

NumberField.displayName = "NumberField";

export default NumberField;
