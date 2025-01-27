import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { Control } from "react-hook-form";
import TableCombobox from "./table-fields/table-combobox";
import { useFieldDisabled } from "../hooks";
import TableStringField from "./table-fields/table-string-field";
import TableNumberField from "./table-fields/table-number-field";
import TableIntegerfield from "./table-fields/table-integer-field";
import TableBooleanField from "./table-fields/table-boolean-field";

export type TableSingleFieldType = {
  zodKey: string;
  schemaField: JSONSchema;
  control: Control;
  disabled: boolean;
};

export function TableSingleField({
  zodKey,
  schemaField,
  control,
}: TableSingleFieldType): React.ReactNode {
  const isDisabled = useFieldDisabled(schemaField, zodKey);
  switch (schemaField.type) {
    case "string":
      if (schemaField.enum && schemaField.enum.length) {
        return (
          <TableCombobox
            key={zodKey}
            control={control}
            zodKey={zodKey}
            schemaField={schemaField}
            disabled={isDisabled}
          />
        );
      } else {
        return (
          <TableStringField
            key={zodKey}
            control={control}
            zodKey={zodKey}
            disabled={isDisabled}
            schemaField={schemaField}
          />
        );
      }

    case "number":
      return (
        <TableNumberField
          key={zodKey}
          control={control}
          zodKey={zodKey}
          disabled={isDisabled}
          schemaField={schemaField}
        />
      );
    case "integer":
      return (
        <TableIntegerfield
          key={zodKey}
          control={control}
          zodKey={zodKey}
          disabled={isDisabled}
          schemaField={schemaField}
        />
      );
    case "boolean":
      return (
        <TableBooleanField
          key={zodKey}
          control={control}
          zodKey={zodKey}
          disabled={isDisabled}
          schemaField={schemaField}
        />
      );
    default:
      return (
        <div key={zodKey}>
          title: {schemaField.title ? schemaField.title : zodKey} description
          {":"} {schemaField.description} <br /> this type is not supported{" "}
          {schemaField.type}
        </div>
      );
  }
}
