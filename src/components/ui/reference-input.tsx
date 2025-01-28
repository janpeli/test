import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { ProjectStructure } from "electron/src/project";
import { useCallback, useEffect, useState } from "react";
import Treeview from "./treeview/treeview";
import React from "react";

type ReferenceInputProps = {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  projectStructure?: ProjectStructure;
  disabled: boolean;
  allowMultiselect: boolean;
};

const ReferenceInput = React.forwardRef<HTMLButtonElement, ReferenceInputProps>(
  (props, ref) => {
    const [value, setValue] = useState<string | string[]>(
      props.value ? props.value : ""
    );
    const [selectedValue, setSelectedValue] = useState<string | string[]>("");

    useEffect(() => {
      props.onChange(value);
    }, [value]);

    const setV = useCallback((v: string | string[]) => {
      setSelectedValue(v);
    }, []);

    if (!props.projectStructure) return <>No referenceable objects</>;

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button ref={ref} variant="outline" disabled={props.disabled}>
            {value ? value : "add reference"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit reference</DialogTitle>
            <DialogDescription>
              Make changes to your reference here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <Treeview
            projecStructure={props.projectStructure}
            onSelect={setV}
            defaultValue={props.value ? props.value : ""}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant={"default"}
                onClick={() => {
                  setValue(selectedValue);
                }}
              >
                Save changes
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant={"secondary"}>Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

ReferenceInput.displayName = "ReferenceInput";

export default ReferenceInput;
