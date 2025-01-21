import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

import { getFormSchemas } from "../utilities";

import { EditorFormLayout } from "./editor-form-layout";
import RenderFormField from "./render-form-field";

import { useAppSelectorWithParams } from "@/hooks/hooks";
import {
  selectFile,
  selectOpenFileId,
} from "@/API/editor-api/editor-api.slice";
import { cn } from "@/lib/utils";
import { selectSchemaByFileId } from "@/API/project-api/project-api.slice";

type EditorFormProps = {
  editorIdx: number;
  fileId: string;
};

export function EditorForm(props: EditorFormProps) {
  const openFileID = useAppSelectorWithParams(selectOpenFileId, {
    editorIdx: props.editorIdx,
  });

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

  return (
    <div
      className={cn(openFileID === props.fileId ? "flex flex-col" : "hidden")}
    >
      <EditorFormLayout schemaObject={schemaObject}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-2 p-1"
          >
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
    </div>
  );
}
