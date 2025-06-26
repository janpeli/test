import TableCombobox from "./table-fields/table-combobox";
import TableStringField from "./table-fields/table-string-field";
import TableNumberField from "./table-fields/table-number-field";
import TableIntegerfield from "./table-fields/table-integer-field";
import TableBooleanField from "./table-fields/table-boolean-field";
import TableReferenceField from "./table-fields/table-reference-field";
//import TableSelectField from "./table-fields/table-select-field";
import TableTagField from "./table-fields/table-tag-field";
import React from "react";
import FieldDisabler from "../field-disabler";
import { FormFieldProps } from "../render-form-field";
import TableSubReferenceField from "./table-fields/table-sub-reference-field";

function TableSingleFieldComponent(props: FormFieldProps): React.ReactNode {
  const { schemaField } = props;
  switch (schemaField.type) {
    case "string":
      if (schemaField.enum && schemaField.enum.length) {
        return (
          <FieldDisabler {...props}>
            <TableCombobox {...props} />
          </FieldDisabler>
        );
      } /*else if (schemaField.enum && schemaField.enum.length <= 5) {
        return (
          <TableSelectField
            key={zodKey}
            zodKey={zodKey}
            schemaField={schemaField}
            control={control}
            disabled={isDisabled}
          />
        );
      }*/ else {
        return (
          <FieldDisabler {...props}>
            <TableStringField {...props} />
          </FieldDisabler>
        );
      }

    case "number":
      return (
        <FieldDisabler {...props}>
          <TableNumberField {...props} />
        </FieldDisabler>
      );
    case "integer":
      return (
        <FieldDisabler {...props}>
          <TableIntegerfield {...props} />
        </FieldDisabler>
      );
    case "boolean":
      return (
        <FieldDisabler {...props}>
          <TableBooleanField {...props} />
        </FieldDisabler>
      );
    case "object":
      if (schemaField.format === "sub-reference") {
        return (
          <FieldDisabler {...props}>
            <TableSubReferenceField {...props} />
          </FieldDisabler>
        );
      } else {
        return (
          <FieldDisabler {...props}>
            <TableReferenceField {...props} />
          </FieldDisabler>
        );
      }
    case "array":
      return (
        <FieldDisabler {...props}>
          <TableTagField {...props} />
        </FieldDisabler>
      );
    default:
      return (
        <div key={props.zodKey}>
          title: {schemaField.title ? schemaField.title : props.zodKey}{" "}
          description
          {":"} {schemaField.description} <br /> this type is not supported{" "}
          {schemaField.type}
        </div>
      );
  }
}

const TableSingleField = React.memo(TableSingleFieldComponent);
TableSingleField.displayName = "TableSingleField";

export default TableSingleField;
