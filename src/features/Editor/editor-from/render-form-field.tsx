import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { Control } from "react-hook-form";
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
//import TagField from "./single-fields/tag-field";

function RenderFormFieldComponent({
  zodKey,
  schemaField,
  formControl,
}: {
  zodKey: string;
  schemaField: JSONSchema;
  formControl: Control;
}): React.ReactNode {
  // finish variations for format of string input eg. date, url, etc

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
            control={formControl}
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
                formControl={formControl}
              />
            </SectionContent>
          </Section>
        );
      }
    case "object":
      if (schemaField.properties && schemaField.properties.reference) {
        return (
          <EditorSingleField
            key={zodKey}
            zodKey={zodKey}
            schemaField={schemaField}
            control={formControl}
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
                    formControl={formControl}
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
          control={formControl}
        />
      );
  }
}

const RenderFormField = React.memo(RenderFormFieldComponent);
RenderFormField.displayName = "RenderFormField";

export default RenderFormField;
