import { cn } from "@/lib/utils";

import RenderFormField from "../../render-form-field";
import { isTableColumn } from "../table-fields/utils";
import { TableRowProps } from "./table-row";

export function ExpandedRow({
  columnCount,
  toggleRow,
  item,
  index,
  schemaField,
  zodKey,
  nestedCount,
  ...rest
}: TableRowProps) {
  return (
    <>
      {nestedCount ? (
        <tr
          id={item + "-exp"}
          className={cn(" hover:bg-muted/50 ", !toggleRow && "hidden")}
        >
          <td colSpan={columnCount + 2} className="px-6 py-4">
            {schemaField.items &&
              !Array.isArray(schemaField.items) &&
              schemaField.items.properties &&
              Object.entries(schemaField.items.properties).map(
                ([name, item]) => {
                  if (!isTableColumn(item)) {
                    return (
                      <RenderFormField
                        key={`${zodKey}.${index}.${name}`}
                        zodKey={`${zodKey}.${index}.${name}`}
                        schemaField={item}
                        {...rest}
                      />
                    );
                  }
                }
              )}
          </td>
        </tr>
      ) : null}
    </>
  );
}
