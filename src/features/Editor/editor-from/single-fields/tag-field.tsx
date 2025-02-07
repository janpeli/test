import { useEffect } from "react";
import TagInput from "@/components/ui/tag-input/tag-input";
import SingleFieldLabel from "./single-field-label";
import { FormFieldProps } from "../render-form-field";

function TagField({
  zodKey,
  schemaField,
  register,
  setValue,
  disabled,
}: FormFieldProps) {
  const { name, ref } = register(zodKey, { disabled: disabled });
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
      <TagInput
        name={name}
        ref={ref}
        onChange={(value) => setValue(zodKey, value)}
      />
    </div>
  );
}

TagField.displayName = "TagField";

export default TagField;
