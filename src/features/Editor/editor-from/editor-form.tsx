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
  useFormState,
  UseFormTrigger,
} from "react-hook-form";
import { JSONSchemaProperties } from "@/lib/JSONSchemaToZod";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import {
  createEditorFormData,
  getFormState,
  updateEditorFormData,
} from "@/API/editor-api/editor-api";
import { selectFileContent } from "@/API/editor-api/editor-api.selectors";
import { selectSchemaByFileId } from "@/API/project-api/project-api.selectors";
import { Button } from "@/components/ui/button";
import { getDefaultValues, getSchemaObject, getZodSchema } from "../utilities";
import { EditorFormLayout } from "./layout/editor-form-layout";
import RenderFormField from "./render-form-field";

type EditorFormProps = {
  editorIdx: number;
  fileId: string;
};

const EditorForm = React.memo(function EditorForm(props: EditorFormProps) {
  const editedFileContent = useAppSelectorWithParams(selectFileContent, {
    editorIdx: props.editorIdx,
    fileId: props.fileId,
  });

  const yamlSchema = useAppSelectorWithParams(selectSchemaByFileId, {
    fileId: props.fileId,
  });

  const schemaObject = useMemo(() => getSchemaObject(yamlSchema), [yamlSchema]);
  const zodSchema = useMemo(() => getZodSchema(schemaObject), [schemaObject]);
  const defaultValues = useMemo(() => {
    const data = getFormState(props.fileId);
    return data
      ? data
      : getDefaultValues(schemaObject, editedFileContent as string);
  }, [schemaObject, editedFileContent, props.fileId]);

  useEffect(() => {
    createEditorFormData(props.fileId, defaultValues);
  }, [props.fileId, defaultValues]);

  const form = useForm<z.infer<typeof zodSchema>>({
    resolver: zodResolver(zodSchema),
    defaultValues: defaultValues,
    mode: "onBlur",
  });

  function onSubmit(values: z.infer<typeof zodSchema>) {
    console.log(values);
    //createEditorFormData(props.fileId, values);
  }

  //console.log("rendering editor form", zodSchema._def);

  return (
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
      {/* <ShowState
        control={form.control}
        fileId={props.fileId}
        trigger={form.trigger}
      /> */}
    </>
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
      {Object.entries(properties).map(([fieldName, fieldContent]) => (
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
      ))}
    </>
  );
});

EditorForm.displayName = "EditorForm";
export default EditorForm;

export function ShowState({
  control,
  fileId,
  trigger,
}: {
  control: Control;
  fileId: string;
  trigger: UseFormTrigger<FieldValues>;
}) {
  const formData = useWatch({ control: control });
  const { errors } = useFormState({
    control,
  });

  console.log("useWatch triggered");

  console.log({ errors });

  return (
    <div className="flex-1">
      <Button onClick={() => updateEditorFormData(fileId, formData)}>
        save
      </Button>
      <Button
        onClick={() => {
          trigger();
        }}
      >
        validate
      </Button>
      <div className="mt-8 p-4 border rounded">
        <h3 className="text-sm font-medium mb-2">Form State (Debug)</h3>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
      <div className="mt-8 p-4 border rounded">
        <h3 className="text-sm font-medium mb-2">Errors</h3>
        <pre className="text-sm overflow-auto">
          {/* {JSON.stringify(errors, null, 2)} */}
        </pre>
      </div>
    </div>
  );
}
