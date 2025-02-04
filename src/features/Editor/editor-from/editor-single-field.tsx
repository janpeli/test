import { JSONSchema } from "@/lib/JSONSchemaToZod";
import StringField from "./single-fields/string-field";
import NumberField from "./single-fields/number-field";
import IntegerField from "./single-fields/integer-field";
import BooleanField from "./single-fields/boolean-field";
import ComboboxField from "./single-fields/combobox-field";
//import SelectField from "./single-fields/select-field";
import TagField from "./single-fields/tag-field";
import ReferenceField from "./single-fields/reference-field";
import SubReferenceField from "./single-fields/sub-reference-field";

export type FieldProps = {
  zodKey: string;
  schemaField: JSONSchema;
};

export function EditorSingleField({
  zodKey,
  schemaField,
}: FieldProps): React.ReactNode {
  console.log("editor field: ", zodKey);
  switch (schemaField.type) {
    case "array":
      return (
        <TagField key={zodKey} zodKey={zodKey} schemaField={schemaField} />
      );
    case "object":
      if (
        schemaField.properties &&
        "$reference" in schemaField.properties &&
        schemaField.properties.$reference
      )
        return (
          <ReferenceField
            key={zodKey}
            zodKey={zodKey}
            schemaField={schemaField}
          />
        );

      if (
        schemaField.properties &&
        "$sub_reference" in schemaField.properties &&
        schemaField.properties.$sub_reference
      )
        return (
          <SubReferenceField
            key={zodKey}
            zodKey={zodKey}
            schemaField={schemaField}
          />
        );

      return (
        <div key={zodKey}>
          {`title: ${
            schemaField.title ? schemaField.title : zodKey
          } description: ${schemaField.description}`}
          <br />
          {`Object failed to render as reference`}
        </div>
      );
    case "string":
      if (schemaField.enum && schemaField.enum.length > 0) {
        return (
          <ComboboxField
            key={zodKey}
            zodKey={zodKey}
            schemaField={schemaField}
          />
        );
      } /*  else if (schemaField.enum && schemaField.enum.length <= 5) {
        return (
          <SelectField key={zodKey} zodKey={zodKey} schemaField={schemaField} />
        );
      }*/ else {
        return (
          <StringField key={zodKey} zodKey={zodKey} schemaField={schemaField} />
        );
      }

    case "number":
      return (
        <NumberField key={zodKey} schemaField={schemaField} zodKey={zodKey} />
      );
    case "integer":
      return (
        <IntegerField key={zodKey} schemaField={schemaField} zodKey={zodKey} />
      );
    case "boolean":
      return (
        <BooleanField key={zodKey} schemaField={schemaField} zodKey={zodKey} />
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
