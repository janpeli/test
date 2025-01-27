import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { Control } from "react-hook-form";
import StringField from "./single-fields/string-field";
import NumberField from "./single-fields/number-field";
import IntegerField from "./single-fields/integer-field";
import BooleanField from "./single-fields/boolean-field";
import ComboboxField from "./single-fields/combobox-field";
import SelectField from "./single-fields/select-field";
import TagField from "./single-fields/tag-field";

export type FieldProps = {
  zodKey: string;
  schemaField: JSONSchema;
  control: Control;
};

export function EditorSingleField({
  zodKey,
  schemaField,
  control,
}: FieldProps): React.ReactNode {
  switch (schemaField.type) {
    case "array":
      return (
        <TagField
          key={zodKey}
          zodKey={zodKey}
          schemaField={schemaField}
          control={control}
        />
      );
    case "string":
      if (schemaField.enum && schemaField.enum.length > 5) {
        return (
          <ComboboxField
            key={zodKey}
            zodKey={zodKey}
            schemaField={schemaField}
            control={control}
          />
        );
      } else if (schemaField.enum && schemaField.enum.length <= 5) {
        return (
          <SelectField
            key={zodKey}
            zodKey={zodKey}
            schemaField={schemaField}
            control={control}
          />
        );
      } else {
        return (
          <StringField
            key={zodKey}
            zodKey={zodKey}
            schemaField={schemaField}
            control={control}
          />
        );
      }

    case "number":
      return (
        <NumberField
          key={zodKey}
          control={control}
          schemaField={schemaField}
          zodKey={zodKey}
        />
      );
    case "integer":
      return (
        <IntegerField
          key={zodKey}
          control={control}
          schemaField={schemaField}
          zodKey={zodKey}
        />
      );
    case "boolean":
      return (
        <BooleanField
          key={zodKey}
          control={control}
          schemaField={schemaField}
          zodKey={zodKey}
        />
      );
    default:
      return (
        <div key={zodKey}>
          {`title: ${
            schemaField.title ? schemaField.title : zodKey
          } description: ${schemaField.description}`}
          <br />
          {`Could not identify this type: ${schemaField.type}`}
        </div>
      );
  }
}
