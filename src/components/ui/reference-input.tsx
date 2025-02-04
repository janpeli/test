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
import { useCallback, useMemo, useState, forwardRef } from "react";
import Treeview from "./treeview/treeview";
import React from "react";
import { getProjectStructureFiltered } from "@/API/project-api/project-api";
//import { ProjectStructure } from "electron/src/project";

type ReferenceInputProps = {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  disabled?: boolean;
  allowMultiselect: boolean;
  sufix?: string[];
  name?: string;
};

const ReferenceInputComponent = forwardRef<
  HTMLInputElement,
  ReferenceInputProps
>(({ value, onChange, disabled, sufix, name }, ref) => {
  const [selectedValue, setSelectedValue] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = useCallback((v: string | string[]) => {
    setSelectedValue(v);
  }, []);

  const handleSave = useCallback(() => {
    onChange(selectedValue);
    setIsOpen(false);
  }, [selectedValue, onChange]);

  const projectStructure = useMemo(
    () => getProjectStructureFiltered(sufix || []),
    [sufix]
  );

  if (!projectStructure) {
    return <div className="text-muted">No referenceable objects</div>;
  }

  const displayValue = Array.isArray(selectedValue)
    ? selectedValue.join(", ")
    : selectedValue || "add reference";

  return (
    <div>
      <input type="hidden" value={selectedValue} ref={ref} />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            id={name}
            name={name}
            variant="outline"
            disabled={disabled}
            className="w-full text-left"
          >
            {displayValue}
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
            projecStructure={projectStructure}
            onSelect={handleSelect}
            defaultValue={selectedValue}
          />
          <DialogFooter>
            <Button variant="default" onClick={handleSave}>
              Save changes
            </Button>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

const ReferenceInput = React.memo(ReferenceInputComponent);
export default ReferenceInput;
