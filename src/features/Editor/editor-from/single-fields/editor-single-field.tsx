import StringField from "./string-field";
import NumberField from "./number-field";
import IntegerField from "./integer-field";
import BooleanField from "./boolean-field";
import ComboboxField from "./combobox-field";
//import SelectField from "./single-fields/select-field";
import TagField from "./tag-field";
import ReferenceField from "./reference-field";
import SubReferenceField from "./sub-reference-field";
import FieldDisabler from "../field-disabler";
import { FormFieldProps } from "../render-form-field";
import { isReferenceField, isSubReferenceField } from "../../utilities";

export function EditorSingleField(props: FormFieldProps): React.ReactNode {
  const { schemaField, zodKey } = props;
  switch (schemaField.type) {
    case "array":
      return (
        <FieldDisabler {...props}>
          <TagField {...props} />
        </FieldDisabler>
      );
    case "object":
      if (isReferenceField(schemaField))
        return (
          <FieldDisabler {...props}>
            <ReferenceField {...props} />
          </FieldDisabler>
        );

      if (isSubReferenceField(schemaField))
        return (
          <FieldDisabler {...props}>
            <SubReferenceField {...props} />
          </FieldDisabler>
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
          <FieldDisabler {...props}>
            <ComboboxField {...props} />
          </FieldDisabler>
        );
      } /*  else if (schemaField.enum && schemaField.enum.length <= 5) {
        return (
          <SelectField key={zodKey} zodKey={zodKey} schemaField={schemaField} />
        );
      }*/ else {
        return (
          <FieldDisabler {...props}>
            <StringField {...props} />
          </FieldDisabler>
        );
      }

    case "number":
      return (
        <FieldDisabler {...props}>
          <NumberField {...props} />
        </FieldDisabler>
      );
    case "integer":
      return (
        <FieldDisabler {...props}>
          <IntegerField {...props} />
        </FieldDisabler>
      );
    case "boolean":
      return (
        <FieldDisabler {...props}>
          <BooleanField {...props} />
        </FieldDisabler>
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
