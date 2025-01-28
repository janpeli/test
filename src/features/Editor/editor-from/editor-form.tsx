import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitErrorHandler, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

import { getFormSchemas } from "../utilities";

import { EditorFormLayout } from "./editor-form-layout";
import RenderFormField from "./render-form-field";

import { useAppSelectorWithParams } from "@/hooks/hooks";
import { selectFile } from "@/API/editor-api/editor-api.slice";

import { selectSchemaByFileId } from "@/API/project-api/project-api.slice";
import React from "react";

type EditorFormProps = {
  editorIdx: number;
  fileId: string;
};

const EditorForm = React.memo(function EditorForm(props: EditorFormProps) {
  const editedFile = useAppSelectorWithParams(selectFile, {
    editorIdx: props.editorIdx,
    fileId: props.fileId,
  });

  const yamlSchema = useAppSelectorWithParams(selectSchemaByFileId, {
    fileId: props.fileId,
  });

  //const [yamlSchema, setYamlSchema] = useState(yaml_schema);
  const { zodSchema, schemaObject, defaulValues } = useMemo(
    () => getFormSchemas(yamlSchema, editedFile?.content as string),
    [yamlSchema, editedFile?.content]
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

  const a: SubmitErrorHandler<z.infer<typeof zodSchema>> = (error) => {
    console.log(error);
  };

  return (
    <EditorFormLayout schemaObject={schemaObject}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, a)}
          className="space-y-2 p-1"
        >
          {schemaObject.properties &&
            Object.entries(schemaObject.properties).map(
              ([fieldName, fieldContent]) => {
                //console.log(fieldName, fieldContent);
                return (
                  <div key={fieldName}>
                    <RenderFormField
                      zodKey={fieldName}
                      schemaField={fieldContent}
                      formControl={form.control}
                    />
                  </div>
                );
              }
            )}
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </EditorFormLayout>
  );
});

EditorForm.displayName = "EditorForm";
export default EditorForm;
