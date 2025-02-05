import { JSONSchema } from "@/lib/JSONSchemaToZod";
import {
  Control,
  FieldValues,
  UseFieldArrayRemove,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import React, { useState } from "react";
import { ExpandedRow } from "./expanded-row";
import { MainRow } from "./main-row";

function TableRowComponent(props: {
  item: string;
  index: number;
  fieldSchema: JSONSchema;
  zodKey: string;
  remove: UseFieldArrayRemove;
  columnCount: number;
  nestedCount: number;
  control: Control;
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  getValues: UseFormGetValues<FieldValues>;
}) {
  const [toggleRow, setToggleRow] = useState<boolean>(false);

  return (
    <>
      <MainRow toggleRow={toggleRow} setToggleRow={setToggleRow} {...props} />
      <ExpandedRow toggleRow={toggleRow} {...props} />
    </>
  );
}

const TableRow = React.memo(TableRowComponent);
TableRow.displayName = "TableRow";

export default TableRow;
