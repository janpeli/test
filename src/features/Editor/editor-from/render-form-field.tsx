import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { EditorSingleField } from "./editor-single-field";
import EditorFormTooltip from "./editor-form-tooltip";
//import { Tag, TagInput } from "emblor";

import { Table } from "./table/table";
import {
  Section,
  SectionContent,
  SectionHeader,
  SectionTitle,
} from "@/components/ui/section";
import React from "react";
import {
  Control,
  FieldValues,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
//import TagField from "./single-fields/tag-field";

function RenderFormFieldComponent({
  zodKey,
  schemaField,
  control,
  register,
  setValue,
  getValues,
}: {
  zodKey: string;
  schemaField: JSONSchema;
  control: Control;
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  getValues: UseFormGetValues<FieldValues>;
}): React.ReactNode {
  // finish variations for format of string input eg. date, url, etc

  console.log("rendering:", zodKey);
  switch (schemaField.type) {
    case "array":
      if (
        zodKey === "general.tags" ||
        (schemaField.items &&
          !Array.isArray(schemaField.items) &&
          schemaField.items.type === "string")
      ) {
        return (
          <EditorSingleField
            key={zodKey}
            zodKey={zodKey}
            schemaField={schemaField}
            control={control}
            register={register}
            setValue={setValue}
            getValues={getValues}
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
              <Table
                fieldSchema={schemaField}
                zodKey={zodKey}
                control={control}
                register={register}
                setValue={setValue}
                getValues={getValues}
              />
            </SectionContent>
          </Section>
        );
      }
    case "object":
      if (
        schemaField.properties &&
        typeof schemaField.properties === "object" &&
        (("$reference" in schemaField.properties &&
          schemaField.properties.$reference) ||
          ("$sub_reference" in schemaField.properties &&
            schemaField.properties.$sub_reference))
      ) {
        return (
          <EditorSingleField
            key={zodKey}
            zodKey={zodKey}
            schemaField={schemaField}
            control={control}
            register={register}
            setValue={setValue}
            getValues={getValues}
          />
        );
      } else if (schemaField.properties) {
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
                    control={control}
                    register={register}
                    setValue={setValue}
                    getValues={getValues}
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
          control={control}
          register={register}
          setValue={setValue}
          getValues={getValues}
        />
      );
  }
}

const RenderFormField = React.memo(RenderFormFieldComponent);
RenderFormField.displayName = "RenderFormField";

export default RenderFormField;
