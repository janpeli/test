import { JSONSchema } from "@/lib/JSONSchemaToZod";
import React, { ReactElement } from "react";
import { useFieldDisabled } from "../../hooks";
import { Control } from "react-hook-form";

const FieldDisabler = React.memo(function FieldDisabler({
  schemaField,
  children,
  zodKey,
  control,
}: {
  schemaField: JSONSchema;
  children: ReactElement;
  zodKey: string;
  control: Control;
}) {
  if (
    schemaField.valid_for &&
    schemaField.valid_for.property &&
    schemaField.valid_for.enum
  ) {
    return (
      <ValidForField
        schemaField={schemaField}
        zodKey={zodKey}
        control={control}
      >
        {children}
      </ValidForField>
    );
  } else {
    return <>{children}</>;
  }
});

function ValidForField({
  schemaField,
  zodKey,
  children,
  control,
}: {
  schemaField: JSONSchema;
  zodKey: string;
  children: ReactElement;
  control: Control;
}) {
  const isDisabled = useFieldDisabled(schemaField, zodKey, control);
  return React.cloneElement(children, {
    ...children.props, // Keep original props
    disabled: isDisabled, // Override specific props
  });
}

export default FieldDisabler;
