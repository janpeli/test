import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { Control } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditorSingleField } from "./editor-single-field";
import EditorFormTooltip from "./editor-form-tooltip";
//import { Tag, TagInput } from "emblor";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import TagInput from "@/components/ui/tag-input";
import { Table } from "./table/table";

export default function RenderFormField({
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
      if (zodKey === "general.tags") {
        return (
          <FormField
            key={zodKey}
            control={formControl}
            name={zodKey}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {schemaField.title ? schemaField.title : zodKey}
                </FormLabel>
                <FormControl>
                  <TagInput {...field} />
                </FormControl>
                {schemaField.description && (
                  <FormDescription>{schemaField.description}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );
      } else {
        return (
          <Card key={zodKey} className="w-full p-2 col-span-2">
            <CardHeader>
              <CardTitle>
                <EditorFormTooltip tooltip={schemaField.description || ""}>
                  <span>{schemaField.title ? schemaField.title : zodKey}</span>
                </EditorFormTooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table
                fieldSchema={schemaField}
                zodKey={zodKey}
                formControl={formControl}
              />
            </CardContent>
          </Card>
        );
      }
    case "object":
      if (schemaField.properties) {
        return (
          <Card key={zodKey} className="w-full p-2 col-span-2">
            <CardHeader>
              <CardTitle>
                <EditorFormTooltip tooltip={schemaField.description || ""}>
                  <span>{schemaField.title ? schemaField.title : zodKey}</span>
                </EditorFormTooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
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
            </CardContent>
          </Card>
        );
      }
      return (
        <div key={zodKey}>
          title: {schemaField.title || zodKey} description
          {":"} {schemaField.description} <br /> Object does not have properties{" "}
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
