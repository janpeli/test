import { Input } from "@/components/ui/input";
import { FieldProps } from "../editor-single-field";
import SingleFieldLabel from "./single-field-label";

function IntegerField({ zodKey, schemaField, register }: FieldProps) {
  const field = register(zodKey);
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
