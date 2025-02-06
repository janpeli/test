import { useEffect } from "react";
import TagInput from "@/components/ui/tag-input/tag-input";
import { FieldProps } from "./editor-single-field";
import SingleFieldLabel from "./single-field-label";

function TagField({
  zodKey,
  schemaField,
  register,
  setValue,
  disabled,
}: FieldProps) {
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
