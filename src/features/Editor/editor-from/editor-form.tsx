import { zodResolver } from "@hookform/resolvers/zod";
import { Control, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

import { getFormSchemas } from "../utilities";

import { JSONSchema } from "@/lib/JSONSchemaToZod";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EditorFormLayout } from "./editor-form-layout";
import { EditorSingleField } from "./editor-single-field";
import { useMemo } from "react";

function RenderArray({
  zodKey,
  fieldSchema,
  formControl,
}: {
  zodKey: string;
  fieldSchema: JSONSchema;
  formControl: Control;
}) {
  const { fields, append, remove } = useFieldArray({
    control: formControl,
    name: zodKey,
  });
  return (
    <div key={zodKey} className="mb-4 p-2 flex flex-col">
      <h3 className="font-semibold mb-2">
        {fieldSchema.title || fieldSchema.description || zodKey}
      </h3>
      {fields.map((item, index) => (
        <div key={item.id} className="border p-4 mb-2 rounded-md flex-row flex">
          {Array.isArray(fieldSchema.items) || !fieldSchema.items
            ? null
            : RenderFormField({
                zodKey: `${zodKey}.${index}`,
                schemaField: fieldSchema.items,
                formControl: formControl,
              })}

          <button
            type="button"
            onClick={() => remove(index)}
            className="mt-2 text-red-500 hover:underline"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({})}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
      >
        Add {fieldSchema.title || fieldSchema.description || zodKey}
      </button>
    </div>
  );
}

function RenderFormField({
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
              {schemaField.title ? schemaField.title : zodKey}
            </CardTitle>
            <CardDescription>{schemaField.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <RenderArray
              fieldSchema={schemaField}
              zodKey={zodKey}
              formControl={formControl}
            />
          </CardContent>
          <CardFooter>
            title: {schemaField.title ? schemaField.title : zodKey} description
            {":"} {schemaField.description}{" "}
          </CardFooter>
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
                ([fieldName, fieldContent]) =>
                  RenderFormField({
                    zodKey: zodKey + "." + fieldName,
                    schemaField: fieldContent,
                    formControl: formControl,
                  })
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

export function EditorForm({ yamlSchema }: { yamlSchema: string }) {
  /* const [schemaObject, setSchemaObject] = useState<JSONSchema>(
    getFormSchemas(yamlSchema).schemaObject
  );
  const [zodSchema, setZodSchema] = useState(
    getFormSchemas(yamlSchema).zodSchema
  );
  */
  const { zodSchema, schemaObject, defaulValues } = useMemo(
    () => getFormSchemas(yamlSchema),
    [yamlSchema]
  );

  const form = useForm<z.infer<typeof zodSchema>>({
    resolver: zodResolver(zodSchema),
    defaultValues: defaulValues,
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof zodSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
  }

  return (
    <EditorFormLayout schemaObject={schemaObject}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <>
            {schemaObject.properties &&
              Object.entries(schemaObject.properties).map(
                ([fieldName, fieldContent]) => (
                  <div key={fieldName}>
                    {RenderFormField({
                      zodKey: fieldName,
                      schemaField: fieldContent,
                      formControl: form.control,
                    })}
                  </div>
                )
              )}
          </>

          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </EditorFormLayout>
  );
}
