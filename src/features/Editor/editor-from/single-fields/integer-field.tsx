import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import SingleFieldLabel from "./single-field-label";
import { FormFieldProps } from "../render-form-field";

function IntegerField({
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
      <Input type="number" step="1" pattern="\d+" {...field} />
    </div>
  );
}

IntegerField.displayName = "IntegerField";

export default IntegerField;
