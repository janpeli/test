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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import {
  getDefaultValues,
  // getSchemaObject,
  getZodSchema,
} from "../Editor/utilities";
import { createEditorFormData } from "@/API/editor-api/editor-api";
import { JSONSchema } from "@/lib/JSONSchemaToZod";

function ModalCreateNewObject() {
  const fields = useMemo(() => {
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
    };
    (schema["properties"] as Record<string, JSONSchema>)["template"] = {
      title: "Template",
      description: "Object template to be aplied during creation",
      type: "string",
    };
    return schema;
  }, []);

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
      <DialogFooter>
        <DialogClose asChild>
          <Button onClick={() => closeModals()}>
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

export default ModalCreateNewObject;
