import React, { useEffect, useMemo } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  Control,
  UseFormRegister,
  FieldValues,
  UseFormSetValue,
  UseFormGetValues,
  useWatch,
} from "react-hook-form";
import { JSONSchemaProperties } from "@/lib/JSONSchemaToZod";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import {
  createEditorFormData,
  updateEditorFormData,
} from "@/API/editor-api/editor-api";
import { selectFile } from "@/API/editor-api/editor-api.slice";
import { selectSchemaByFileId } from "@/API/project-api/project-api.slice";
import { Button } from "@/components/ui/button";
import { getFormSchemas } from "../utilities";
import { EditorFormLayout } from "./layout/editor-form-layout";
import RenderFormField from "./render-form-field";

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

  useEffect(() => {
    createEditorFormData(props.fileId, defaulValues);
  }, [props.fileId, defaulValues]);

  const form = useForm<z.infer<typeof zodSchema>>({
    resolver: zodResolver(zodSchema),
    defaultValues: defaulValues,
    mode: "onSubmit",
  });

  function onSubmit(values: z.infer<typeof zodSchema>) {
    console.log(values);
    //createEditorFormData(props.fileId, values);
  }

  console.log("rendering editor form");

  // const setFormDataInRedux = useCallback(
  //   (newValue: FieldValues) => {
  //     console.log("blur");
  //     updateEditorFormData(props.fileId, newValue);
  //   },
  //   [props.fileId]
  // );

  return (
    // <Form {...form}>
    <>
      <EditorFormLayout schemaObject={schemaObject}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 p-1">
          {schemaObject.properties && (
            <ReanderSections
              properties={schemaObject.properties}
              control={form.control}
              register={form.register}
              setValue={form.setValue}
              getValues={form.getValues}
              fileId={props.fileId}
            />
          )}
        </form>
      </EditorFormLayout>
      <ShowState control={form.control} fileId={props.fileId} />
    </>
    // </Form>
  );
});

const ReanderSections = React.memo(function RenderSections({
  properties,
  control,
  register,
  setValue,
  getValues,
  fileId,
}: {
  properties: JSONSchemaProperties;
  control: Control;
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  getValues: UseFormGetValues<FieldValues>;
  fileId: string;
}) {
  return (
    <>
      {Object.entries(properties).map(([fieldName, fieldContent]) => {
        //console.log(fieldName, fieldContent);
        return (
          <div key={fieldName}>
            <RenderFormField
              zodKey={fieldName}
              schemaField={fieldContent}
              control={control}
              register={register}
              setValue={setValue}
              getValues={getValues}
              fileId={fileId}
            />
          </div>
        );
      })}
    </>
  );
});

EditorForm.displayName = "EditorForm";
export default EditorForm;

function ShowState({ control, fileId }: { control: Control; fileId: string }) {
  const formData = useWatch({ control: control });
  console.log("useWatch triggered");
  return (
    <div className="flex-1">
      <Button onClick={() => updateEditorFormData(fileId, formData)}>
        save
      </Button>
      <pre>{JSON.stringify(formData, null, 2)}</pre>
    </div>
  );
}
