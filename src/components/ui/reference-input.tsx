import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useCallback, useMemo, useRef, useState, forwardRef } from "react";
import Treeview from "./treeview/treeview";
import { TreeController } from "./treeview/tree/controllers/tree-controller";
import React from "react";
import { ExternalLink } from "lucide-react";
import {
  getProjectStructureFiltered,
  getProjectStructurebyId,
} from "@/API/project-api/project-api";
import { openFileById } from "@/API/editor-api/editor-api";
import { cn } from "@/lib/utils";
//import { ProjectStructure } from "electron/src/project";

type ReferenceInputProps = {
  value: string | string[];
  onChange: (value: string | string[] | undefined) => void;
  disabled?: boolean;
  allowMultiselect: boolean;
  sufix?: string[];
  name?: string;
};

const ReferenceInputComponent = forwardRef<
  HTMLInputElement,
  ReferenceInputProps
>(({ value, onChange, disabled, sufix, name }, ref) => {
  const [selectedValue, setSelectedValue] = useState<
    string | string[] | undefined
  >(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const treeRef = useRef<TreeController | null>(null);

  const captureTree = useCallback((tree: TreeController) => {
    treeRef.current = tree;
  }, []);

  const handleSelect = useCallback((v: string | string[]) => {
    setSelectedValue(v);
  }, []);

  const handleClear = useCallback(() => {
    // Clearing removes the reference entirely (undefined), rather than leaving
    // an empty value behind that would serialize as an empty reference.
    setSelectedValue(undefined);
    treeRef.current?.clearSelectedNodes();
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

  // Normalize the stored value (string | string[]) to a flat list of file ids
  // so single- and multi-reference fields render identically as chips.
  const ids = Array.isArray(selectedValue)
    ? selectedValue
    : selectedValue
      ? [selectedValue]
      : [];

  // Resolve a file id (project-relative path) to its tree display name, falling
  // back to the raw id if the referenced file no longer exists.
  const nameFor = (id: string) => getProjectStructurebyId(id)?.name ?? id;

  const hasSelection = ids.length > 0;

  return (
    <div className="w-full">
      <input type="hidden" value={selectedValue ?? ""} ref={ref} />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            "flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background p-1 text-sm",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {ids.length === 0 ? (
            <button
              type="button"
              id={name}
              name={name}
              disabled={disabled}
              onClick={() => setIsOpen(true)}
              className="px-2 py-1 text-left text-muted-foreground disabled:pointer-events-none"
            >
              add reference
            </button>
          ) : (
            ids.map((id) => (
              <div
                key={id}
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground"
              >
                <button
                  type="button"
                  disabled={disabled}
                  title={id}
                  onClick={() => setIsOpen(true)}
                  className="text-left disabled:pointer-events-none"
                >
                  {nameFor(id)}
                </button>
                {/* Navigation, not mutation — kept enabled even when disabled. */}
                <button
                  type="button"
                  aria-label={`Open ${nameFor(id)}`}
                  title="Open file"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFileById(id);
                  }}
                  className="rounded-sm p-0.5 hover:bg-secondary-foreground/20 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
        <DialogContent className="sm:max-w-[425px] max-h-[85vh] grid-rows-[auto_minmax(0,1fr)_auto]">
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
            onDblClick={handleSave}
            treeCallBack={captureTree}
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={handleClear}
              disabled={hasSelection ? false : true}
              className="mr-auto"
            >
              Clear
            </Button>
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
