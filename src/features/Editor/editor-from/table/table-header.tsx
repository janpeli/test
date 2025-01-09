import { JSONSchema } from "@/lib/JSONSchemaToZod";
import TableHeaderCell from "./table-header-cell";

export function TableHeader({ fieldSchema }: { fieldSchema: JSONSchema }) {
  return (
    <thead className="bg-gray-50">
      <tr>
        <th className="w-12 px-6 py-3"></th>
        {fieldSchema.items &&
          !Array.isArray(fieldSchema.items) &&
          fieldSchema.items.properties &&
          Object.entries(fieldSchema.items.properties).map(([name, item]) => {
            return <TableHeaderCell> {item.title || name} </TableHeaderCell>;
          })}
        <th className="w-12 px-6 py-3"></th>
      </tr>
    </thead>
  );
}
