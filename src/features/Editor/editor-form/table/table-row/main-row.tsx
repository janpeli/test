import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import TableSingleField from "../table-single-field";
import { getTableColumns } from "../column-sizing.core";
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
  return (
    <tr
      key={item}
      className={cn(
        "divide-x transition-colors hover:bg-muted/60",
        index % 2 === 1 && "bg-muted/30"
      )}
    >
      {nestedCount ? (
        <td key="open" className="w-9 p-0 text-center align-middle">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
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
        getTableColumns(schemaField.items).map(([name, item]) => (
          <td
            key={`${zodKey}.${index}.${name}`}
            className="p-0 align-middle"
          >
            <TableSingleField
              key={`${zodKey}.${index}.${name}`}
              zodKey={`${zodKey}.${index}.${name}`}
              schemaField={item}
              disabled={false}
              {...rest}
            />
          </td>
        ))}

      <td key="remove" className="w-9 p-0 text-center align-middle">
        <Button
          type="button"
          variant="ghost"
          onClick={() => remove(index)}
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
}
