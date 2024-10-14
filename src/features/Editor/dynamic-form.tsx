import {
  useForm,
  FormProvider,
  useFieldArray,
  UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getFormSchemas,
  ISchema,
  ISchemaField,
  shouldFieldBeVisible,
} from "./utilities";

const DynamicFormField = ({
  fieldKey,
  value,
  propertyName,
  methods,
}: {
  fieldKey: string;
  value: ISchemaField;
  propertyName: string;
  methods: UseFormReturn;
}) => {
  const { register } = methods;
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
};

const DynamicFormSection = ({
  sections,
  methods,
}: {
  sections: Record<string, ISchemaField>;
  methods: UseFormReturn;
}) => {
  const renderSectionRecursively = (
    fieldParentName: string,
    schemaField: ISchemaField,
    methods: UseFormReturn
  ) => {
    if (schemaField.type == "object" && schemaField.properties) {
      return (
        <>
          {Object.entries(schemaField.properties).map(
            ([fieldName, fieldContent]) => (
              <>
                {fieldContent.type == "object" ? (
                  <div key={`${fieldParentName}.${fieldName}`}>
                    <div>{fieldName}</div>
                    {renderSectionRecursively(
                      `${fieldParentName}.${fieldName}`,
                      fieldContent,
                      methods
                    )}
                  </div>
                ) : (
                  <DynamicFormField
                    fieldKey={`${fieldParentName}.${fieldName}`}
                    value={fieldContent}
                    propertyName={fieldName}
                    methods={methods}
                  />
                )}
              </>
            )
          )}
        </>
      );
    }
    return <></>;
  };

  return (
    <div className=" border-2 border-cyan-900">
      {Object.entries(sections).map(([sectionName, sectionContent]) => (
        <div key={sectionName}>
          {sectionName}
          {sectionContent.properties
            ? renderSectionRecursively(sectionName, sectionContent, methods)
            : null}
        </div>
      ))}
    </div>
  );
};

// Form component
const DynamicForm = ({ yamlSchema }: { yamlSchema: string }) => {
  const { zodSchema, schemaObject } = getFormSchemas(yamlSchema);
  const methods = useForm<z.infer<typeof zodSchema>>({
    resolver: zodResolver(zodSchema),
    defaultValues: {},
  });

  const { register, control, handleSubmit, watch } = methods;
  const watchFields = watch(); // Get all watched values

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit((data) => {
          console.log("Form Data:", data);
        })}
        className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-md"
      >
        {
          //renderFields(schemaObject.properties)
        }
        {schemaObject.title}
        <DynamicFormSection
          sections={schemaObject.properties}
          methods={methods}
        />
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
