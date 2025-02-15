import { closeModals } from "@/API/GUI-api/modal-api";

import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RenderFormField from "../Editor/editor-from/render-form-field";
import { Control, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import {
  getDefaultValues,
  // getSchemaObject,
  getZodSchema,
} from "../Editor/utilities";
import {
  createEditorFormData,
  createFileFromModal,
} from "@/API/editor-api/editor-api";
import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { useAppSelector } from "@/hooks/hooks";
import { selectModalState } from "@/API/GUI-api/modal.slice";
import { normalizeFilename } from "@/API/project-api/utils";
import { selectPluginForModal } from "@/API/project-api/project-api.selectors";
import { Plugin } from "electron/src/project";

function ModalCreateNewObject() {
  const { id } = useAppSelector(selectModalState);
  const plugin = useAppSelector(selectPluginForModal);

  const path = id ? id : "";
  const fields = useMemo(() => {
    const base_objects = plugin?.base_objects.map(
      (baseObject) => baseObject.name
    );
    const schema: JSONSchema = {
      type: "object",
      title: "create object form",
      properties: {},
    };
    (schema["properties"] as Record<string, JSONSchema>)["file_name"] = {
      title: "File name",
      description: "File name",
      type: "string",
    };
    (schema["properties"] as Record<string, JSONSchema>)["base_object_type"] = {
      title: "Object type",
      description: "List of objects that are available for this model",
      type: "string",
      enum: base_objects,
    };
    (schema["properties"] as Record<string, JSONSchema>)["template"] = {
      title: "Template",
      description: "Object template to be aplied during creation",
      type: "string",
    };
    return schema;
  }, [plugin]);

  //const schemaObject = useMemo(() => getSchemaObject(yamlSchema), [yamlSchema]);
  const zodSchema = useMemo(() => getZodSchema(fields), [fields]);
  const defaultValues = useMemo(() => {
    return getDefaultValues(fields, "");
  }, [fields]);

  const form = useForm<z.infer<typeof zodSchema>>({
    resolver: zodResolver(zodSchema),
    defaultValues: defaultValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    createEditorFormData("create-object", defaultValues);
  }, [defaultValues]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create new object</DialogTitle>
        <DialogDescription>
          Choose object type and continue to editor
        </DialogDescription>
      </DialogHeader>

      <form className="space-y-2 p-1">
        {fields.properties &&
          Object.entries(fields.properties).map(([fieldName, fieldContent]) => (
            <RenderFormField
              key={fieldName}
              zodKey={fieldName}
              schemaField={fieldContent}
              control={form.control}
              register={form.register}
              setValue={form.setValue}
              getValues={form.getValues}
              fileId={"create-object"}
            />
          ))}
      </form>

      <ShowNewFileName control={form.control} path={path} plugin={plugin} />
      <DialogFooter>
        <DialogClose asChild>
          <Button
            onClick={() => {
              createFileFromModal();
              closeModals();
            }}
          >
            Create file and continue to editor
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button variant="secondary" onClick={() => closeModals()}>
            Cancel
          </Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}

function ShowNewFileName({
  control,
  path,
  plugin,
}: {
  control: Control;
  path: string;
  plugin?: Plugin;
}) {
  const formData = useWatch({ control: control });
  const file_name = formData.file_name
    ? normalizeFilename(formData.file_name, { replacement: "_" })
    : "";
  const extension =
    plugin && formData.base_object_type
      ? plugin.base_objects.find(
          (obj) => obj.name === formData.base_object_type
        )?.sufix
      : "";
  return (
    <div className="flex-1">
      {path}\{file_name}
      {extension ? "." + extension : ""}.yaml
    </div>
  );
}

export default ModalCreateNewObject;
