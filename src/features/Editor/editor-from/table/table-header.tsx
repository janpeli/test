import { JSONSchema } from "@/lib/JSONSchemaToZod";
import TableHeaderCell from "./table-header-cell";

export function TableHeader({
  fieldSchema,
  nestedCount,
}: {
  fieldSchema: JSONSchema;
  nestedCount: number;
}) {
  return (
    <thead className="bg-gray-50">
      <tr>
        {nestedCount ? <th className="w-12 px-6 py-3"></th> : null}
        {fieldSchema.items &&
          !Array.isArray(fieldSchema.items) &&
          fieldSchema.items.properties &&
          Object.entries(fieldSchema.items.properties).map(([name, item]) => {
            if (item.type !== "object" && item.type !== "array")
              return (
                <TableHeaderCell key={name}>
                  {item.title || name}
                </TableHeaderCell>
              );
          })}
        <th className="w-12 px-6 py-3"></th>
      </tr>
    </thead>
  );
}
