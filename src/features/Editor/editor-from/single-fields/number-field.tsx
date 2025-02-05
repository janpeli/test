import { FieldProps } from "../editor-single-field";
import { Input } from "@/components/ui/input";
import SingleFieldLabel from "./single-field-label";
//import { useFormContext } from "react-hook-form";

function NumberField({ zodKey, schemaField, register }: FieldProps) {
  //const { register } = useFormContext();
  const field = register(zodKey);
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
