import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { Control } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import RenderArray from "./render-array";
import { EditorSingleField } from "./editor-single-field";
import EditorFormTooltip from "./editor-form-tooltip";

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
            <RenderArray
              fieldSchema={schemaField}
              zodKey={zodKey}
              formControl={formControl}
            />
          </CardContent>
        </Card>
      );
    case "object":
      if (schemaField.properties) {
        return (
          <Card key={zodKey} className="w-full p-2 col-span-2">
            <CardHeader>
              <CardTitle>
                {schemaField.title ? schemaField.title : zodKey}
              </CardTitle>
              <CardDescription>{schemaField.description}</CardDescription>
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
