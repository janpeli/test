import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

import { getFormSchemas } from "../utilities";

import { EditorFormLayout } from "./editor-form-layout";
import RenderFormField from "./render-form-field";

export function EditorForm({ yamlSchema }: { yamlSchema: string }) {
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
          {schemaObject.properties &&
            Object.entries(schemaObject.properties).map(
              ([fieldName, fieldContent]) => (
                <div key={fieldName}>
                  <RenderFormField
                    zodKey={fieldName}
                    schemaField={fieldContent}
                    formControl={form.control}
                  />
                </div>
              )
            )}
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </EditorFormLayout>
  );
}
