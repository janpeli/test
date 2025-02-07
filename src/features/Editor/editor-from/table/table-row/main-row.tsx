import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import TableSingleField from "../table-single-field";
import { isTableColumn } from "../table-fields/utils";
import { TableRowProps } from "./table-row";

export interface MainRowProps extends TableRowProps {
  setToggleRow: (a: boolean) => void;
}

export function MainRow({
  setToggleRow,
  toggleRow,
  item,
  index,
  schemaField,
  zodKey,
  remove,
  nestedCount,
  ...rest
}: MainRowProps) {
  /* className="w-6 h-6 flex items-center justify-center rounded-full border  hover:bg-gray-100" */
  return (
    <tr key={item} className="border">
      {nestedCount ? (
        <td key="open" className="border">
          <Button
            type="button"
            variant={"ghost"}
            onClick={() => {
              setToggleRow(!toggleRow);
            }}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                toggleRow ? " rotate-180 " : ""
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </td>
      ) : null}
      {schemaField.items &&
        !Array.isArray(schemaField.items) &&
        schemaField.items.properties &&
        Object.entries(schemaField.items.properties).map(([name, item]) => {
          if (isTableColumn(item)) {
            return (
              <td key={`${zodKey}.${index}.${name}`}>
                <TableSingleField
                  key={`${zodKey}.${index}.${name}`}
                  zodKey={`${zodKey}.${index}.${name}`}
                  schemaField={item}
                  disabled={false}
                  {...rest}
                />
              </td>
            );
          }
        })}

      <td key="remove" className="border">
        <Button
          type="button"
          variant={"ghost"}
          onClick={() => remove(index)}
          size={"icon"}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
}
