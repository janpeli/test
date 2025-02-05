import { JSONSchema } from "@/lib/JSONSchemaToZod";
import {
  Control,
  FieldValues,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import TableCombobox from "./table-fields/table-combobox";
//import { useFieldDisabled } from "../hooks";
import TableStringField from "./table-fields/table-string-field";
import TableNumberField from "./table-fields/table-number-field";
import TableIntegerfield from "./table-fields/table-integer-field";
import TableBooleanField from "./table-fields/table-boolean-field";
import TableReferenceField from "./table-fields/table-reference-field";
//import TableSelectField from "./table-fields/table-select-field";
import TableTagField from "./table-fields/table-tag-field";
import React from "react";
//import FieldDisabler from "./table-fields/field-diasbler";

export type TableSingleFieldType = {
  zodKey: string;
  schemaField: JSONSchema;
  control: Control;
  disabled: boolean;
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  getValues: UseFormGetValues<FieldValues>;
};

function TableSingleFieldComponent({
  zodKey,
  schemaField,
  control,
  register,
  setValue,
  getValues,
}: TableSingleFieldType): React.ReactNode {
  const isDisabled = false; //useFieldDisabled(schemaField, zodKey);
  console.log("table field:", zodKey);
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
            register={register}
            setValue={setValue}
            getValues={getValues}
          />
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
          <TableStringField
            key={zodKey}
            control={control}
            zodKey={zodKey}
            disabled={isDisabled}
            schemaField={schemaField}
            register={register}
            setValue={setValue}
            getValues={getValues}
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
          register={register}
          setValue={setValue}
          getValues={getValues}
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
          register={register}
          setValue={setValue}
          getValues={getValues}
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
          register={register}
          setValue={setValue}
          getValues={getValues}
        />
      );
    case "object":
      return (
        <TableReferenceField
          key={zodKey}
          control={control}
          zodKey={zodKey}
          disabled={isDisabled}
          schemaField={schemaField}
          register={register}
          setValue={setValue}
          getValues={getValues}
        />
      );
    case "array":
      return (
        <TableTagField
          key={zodKey}
          zodKey={zodKey}
          schemaField={schemaField}
          disabled={isDisabled}
          control={control}
          register={register}
          setValue={setValue}
          getValues={getValues}
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

const TableSingleField = React.memo(TableSingleFieldComponent);
TableSingleField.displayName = "TableSingleField";

export default TableSingleField;
