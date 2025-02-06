import {
  Control,
  FieldValues,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
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
import FieldDisabler from "./field-disabler";

export type FieldProps = {
  zodKey: string;
  schemaField: JSONSchema;
  control: Control;
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  getValues: UseFormGetValues<FieldValues>;
  disabled?: boolean;
};

export function EditorSingleField({
  zodKey,
  schemaField,
  control,
  register,
  setValue,
  getValues,
}: FieldProps): React.ReactNode {
  console.log("editor field: ", zodKey);
  switch (schemaField.type) {
    case "array":
      return (
        <FieldDisabler
          schemaField={schemaField}
          zodKey={zodKey}
          control={control}
        >
          <TagField
            key={zodKey}
            zodKey={zodKey}
            schemaField={schemaField}
            control={control}
            register={register}
            setValue={setValue}
            getValues={getValues}
          />
        </FieldDisabler>
      );
    case "object":
      if (
        schemaField.properties &&
        "$reference" in schemaField.properties &&
        schemaField.properties.$reference
      )
        return (
          <FieldDisabler
            schemaField={schemaField}
            zodKey={zodKey}
            control={control}
          >
            <ReferenceField
              key={zodKey}
              zodKey={zodKey}
              schemaField={schemaField}
              control={control}
              register={register}
              setValue={setValue}
              getValues={getValues}
            />
          </FieldDisabler>
        );

      if (
        schemaField.properties &&
        "$sub_reference" in schemaField.properties &&
        schemaField.properties.$sub_reference
      )
        return (
          <FieldDisabler
            schemaField={schemaField}
            zodKey={zodKey}
            control={control}
          >
            <SubReferenceField
              key={zodKey}
              zodKey={zodKey}
              schemaField={schemaField}
              control={control}
              register={register}
              setValue={setValue}
              getValues={getValues}
            />
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
          <FieldDisabler
            schemaField={schemaField}
            zodKey={zodKey}
            control={control}
          >
            <ComboboxField
              key={zodKey}
              zodKey={zodKey}
              schemaField={schemaField}
              control={control}
              register={register}
              setValue={setValue}
              getValues={getValues}
            />
          </FieldDisabler>
        );
      } /*  else if (schemaField.enum && schemaField.enum.length <= 5) {
        return (
          <SelectField key={zodKey} zodKey={zodKey} schemaField={schemaField} />
        );
      }*/ else {
        return (
          <FieldDisabler
            schemaField={schemaField}
            zodKey={zodKey}
            control={control}
          >
            <StringField
              key={zodKey}
              zodKey={zodKey}
              schemaField={schemaField}
              control={control}
              register={register}
              setValue={setValue}
              getValues={getValues}
            />
          </FieldDisabler>
        );
      }

    case "number":
      return (
        <FieldDisabler
          schemaField={schemaField}
          zodKey={zodKey}
          control={control}
        >
          <NumberField
            key={zodKey}
            schemaField={schemaField}
            zodKey={zodKey}
            control={control}
            register={register}
            setValue={setValue}
            getValues={getValues}
          />
        </FieldDisabler>
      );
    case "integer":
      return (
        <FieldDisabler
          schemaField={schemaField}
          zodKey={zodKey}
          control={control}
        >
          <IntegerField
            key={zodKey}
            schemaField={schemaField}
            zodKey={zodKey}
            control={control}
            register={register}
            setValue={setValue}
            getValues={getValues}
          />
        </FieldDisabler>
      );
    case "boolean":
      return (
        <FieldDisabler
          schemaField={schemaField}
          zodKey={zodKey}
          control={control}
        >
          <BooleanField
            key={zodKey}
            schemaField={schemaField}
            zodKey={zodKey}
            control={control}
            register={register}
            setValue={setValue}
            getValues={getValues}
          />
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
