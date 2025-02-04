import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { JSONSchemaProperties } from "@/lib/JSONSchemaToZod";
import { useForm } from "react-hook-form";

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
    mode: "onSubmit",
  });

  function onSubmit(values: z.infer<typeof zodSchema>) {
    console.log(values);
  }

  console.log("rendering editor form");

  return (
    <Form {...form}>
      <EditorFormLayout schemaObject={schemaObject}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 p-1">
          {schemaObject.properties && (
            <ReanderSections properties={schemaObject.properties} />
          )}
          <Button type="submit">Submit</Button>
        </form>
      </EditorFormLayout>
    </Form>
  );
});

const ReanderSections = React.memo(function RenderSections({
  properties,
}: {
  properties: JSONSchemaProperties;
}) {
  return (
    <>
      {Object.entries(properties).map(([fieldName, fieldContent]) => {
        //console.log(fieldName, fieldContent);
        return (
          <div key={fieldName}>
            <RenderFormField zodKey={fieldName} schemaField={fieldContent} />
          </div>
        );
      })}
    </>
  );
});

EditorForm.displayName = "EditorForm";
export default EditorForm;
