import { JSONSchema } from "@/lib/JSONSchemaToZod";
import React, { ReactElement } from "react";
import { useFieldDisabled } from "../../hooks";

function FieldDisabler({
  schemaField,
  children,
  zodKey,
}: {
  schemaField: JSONSchema;
  children: ReactElement;
  zodKey: string;
}) {
  if (
    schemaField.valid_for &&
    schemaField.valid_for.property &&
    schemaField.valid_for.enum
  ) {
    return (
      <ValidForField schemaField={schemaField} zodKey={zodKey}>
        {children}
      </ValidForField>
    );
  } else {
    return <>{children}</>;
  }
}

function ValidForField({
  schemaField,
  zodKey,
  children,
}: {
  schemaField: JSONSchema;
  zodKey: string;
  children: ReactElement;
}) {
  const isDisabled = useFieldDisabled(schemaField, zodKey);
  return React.cloneElement(children, {
    ...children.props, // Keep original props
    disabled: isDisabled, // Override specific props
  });
}

export default FieldDisabler;
