import React from "react";
import {
  Control,
  FieldValues,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { EditorSingleField } from "./single-fields/editor-single-field";
import EditorFormTooltip from "./layout/editor-form-tooltip";
import { Table } from "./table/table";
import {
  Section,
  SectionContent,
  SectionHeader,
  SectionTitle,
} from "@/components/ui/section";
import {
  isReferenceField,
  isSubReferenceField,
  isTagArray,
} from "../utilities";

export interface FormFieldProps {
  zodKey: string;
  schemaField: JSONSchema;
  control: Control;
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  getValues: UseFormGetValues<FieldValues>;
  fileId: string;
  disabled?: boolean;
}

function RenderFormFieldComponent({
  zodKey,
  schemaField,
  ...rest
}: FormFieldProps): React.ReactNode {
  console.log("rendering:", zodKey);
  switch (schemaField.type) {
    case "array":
      if (isTagArray(zodKey, schemaField)) {
        return (
          <EditorSingleField
            key={zodKey}
            zodKey={zodKey}
            schemaField={schemaField}
            {...rest}
          />
        );
      } else {
        return (
          <Section key={zodKey} className="min-w-max max-w-fit p-2 col-span-2">
            <SectionHeader>
              <SectionTitle>
                <EditorFormTooltip tooltip={schemaField.description || ""}>
                  <span>{schemaField.title ? schemaField.title : zodKey}</span>
                </EditorFormTooltip>
              </SectionTitle>
            </SectionHeader>
            <SectionContent>
              <Table schemaField={schemaField} zodKey={zodKey} {...rest} />
            </SectionContent>
          </Section>
        );
      }
    case "object":
      if (
        schemaField.properties &&
        typeof schemaField.properties === "object" &&
        (isReferenceField(schemaField) || isSubReferenceField(schemaField))
      ) {
        return (
          <EditorSingleField
            key={zodKey}
            zodKey={zodKey}
            schemaField={schemaField}
            {...rest}
          />
        );
      }
      if (schemaField.properties) {
        return (
          <Section key={zodKey} className="w-full p-2 col-span-2 max-w-4xl">
            <SectionHeader>
              <SectionTitle>
                <EditorFormTooltip tooltip={schemaField.description || ""}>
                  <span>{schemaField.title || zodKey}</span>
                </EditorFormTooltip>
              </SectionTitle>
            </SectionHeader>
            <SectionContent className="grid grid-cols-2 gap-3">
              {Object.entries(schemaField.properties).map(
                ([fieldName, fieldContent]) => (
                  <RenderFormField
                    key={zodKey + "." + fieldName}
                    zodKey={zodKey + "." + fieldName}
                    schemaField={fieldContent}
                    {...rest}
                  />
                )
              )}
            </SectionContent>
          </Section>
        );
      }
      return (
        <div key={zodKey}>
          {`title: ${schemaField.title || zodKey} description: ${
            schemaField.description
          }`}
          <br /> Object does not have properties
        </div>
      );
    default:
      return (
        <EditorSingleField
          key={zodKey}
          zodKey={zodKey}
          schemaField={schemaField}
          {...rest}
        />
      );
  }
}

const RenderFormField = React.memo(RenderFormFieldComponent);
RenderFormField.displayName = "RenderFormField";

export default RenderFormField;
