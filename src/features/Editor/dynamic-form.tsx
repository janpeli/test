import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getFormSchemas,
  ISchemaField,
  shouldFieldBeVisible,
} from "./utilities";

// Form component
const DynamicForm = ({ yamlSchema }: { yamlSchema: string }) => {
  const { zodSchema, schemaObject } = getFormSchemas(yamlSchema);
  const methods = useForm<z.infer<typeof zodSchema>>({
    resolver: zodResolver(zodSchema),
    defaultValues: {},
  });

  const { register, control, handleSubmit, watch } = methods;
  const watchFields = watch(); // Get all watched values

  // Function to recursively render fields based on schema structure
  const renderFields = (
    properties: Record<string, ISchemaField>,
    parentKey: string = ""
  ) => {
    return Object.entries(properties).map(([propertyName, value]) => {
      const fieldKey: string = parentKey
        ? `${parentKey}.${propertyName}`
        : propertyName;

      if (!shouldFieldBeVisible(parentKey, value, watchFields)) {
        return null;
      }

      if (value.type === "object" && value.properties) {
        return (
          <div key={fieldKey} id={fieldKey} className="mb-4">
            <h3 className="font-semibold mb-2">
              {value.description || propertyName}
            </h3>
            <div className="ml-4 border-l-2 border-gray-200 pl-4">
              {renderFields(value.properties, fieldKey)}
            </div>
          </div>
        );
      } else if (
        value.type === "array" &&
        value.items &&
        value.items.type === "object"
      ) {
        return (
          <>
            {
              "array" /*} <RenderArray
            key={fieldKey}
            identifier={fieldKey}
            fieldKey={fieldKey}
            value={value}
          /> */
            }
          </>
        );
      } else {
        return (
          <div key={fieldKey} className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {value.description || propertyName}
            </label>
            {value.enum ? (
              <select
                {...register(fieldKey)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {value.enum.map((option: string) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : value.type === "string" ? (
              <input
                type="text"
                {...register(fieldKey)}
                className="w-full px-3 py-2 border rounded-md"
              />
            ) : value.type === "boolean" ? (
              <input
                type="checkbox"
                {...register(fieldKey)}
                className="form-checkbox h-5 w-5"
              />
            ) : value.type === "integer" ? (
              <input
                type="number"
                {...register(fieldKey)}
                className="w-full px-3 py-2 border rounded-md"
              />
            ) : null}
          </div>
        );
      }
    });
  };

  function RenderArray({
    fieldKey,
    value,
    identifier,
  }: {
    fieldKey: string;
    value: ISchemaField;
    identifier: string;
  }) {
    const { fields, append, remove } = useFieldArray({
      control,
      name: fieldKey,
    });
    return (
      <div key={fieldKey} className="mb-4">
        <h3 className="font-semibold mb-2">
          {value.description || identifier}
        </h3>
        {fields.map((item, index) => (
          <div key={item.id} className="border p-4 mb-2 rounded-md">
            {renderFields(
              value.items?.properties as Record<string, ISchemaField>,
              `${fieldKey}.${index}`
            )}
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
          Add {identifier}
        </button>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit((data) => {
          console.log("Form Data:", data);
        })}
        className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-md"
      >
        {renderFields(schemaObject.properties)}
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md"
        >
          Submit
        </button>
      </form>
    </FormProvider>
  );
};

export default DynamicForm;
