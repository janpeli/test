import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FormFieldProps } from "../../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";
import { useClearFieldWhenDisabled } from "../../hooks";
import { inlineCellControl } from "./utils";
import StringExpandPopover from "./string-expand-popover";

function TableStringField({
  zodKey,
  schemaField,
  // control,
  disabled,
  register,
  setValue,
  fileId,
  getValues,
}: FormFieldProps) {
  const [open, setOpen] = useState(false);
  const field = register(zodKey, {
    disabled: disabled,
    onBlur: () => {
      updateEditorFormDatabyPath(fileId, getValues(), zodKey);
    },
  });
  useClearFieldWhenDisabled({ disabled, fileId, zodKey, setValue, getValues });
  const isEmail = schemaField.format === "email";

  const inlineInput = (
    <div className="group relative flex w-full items-center">
      <Input
        type={isEmail ? "email" : ""}
        placeholder="…"
        className={cn(inlineCellControl, !disabled && "pr-7")}
        onKeyDown={
          disabled
            ? undefined
            : (e) => {
                if (e.altKey && e.key === "Enter") {
                  e.preventDefault();
                  setOpen(true);
                }
              }
        }
        {...field}
      />
      {!disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          tabIndex={-1}
          aria-label="Expand editor"
          title="Expand editor (Alt+Enter)"
          onClick={() => setOpen(true)}
          className="absolute right-0.5 h-5 w-5 opacity-0 transition-opacity focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100"
        >
          <Maximize2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );

  if (disabled) return inlineInput;

  return (
    <StringExpandPopover
      open={open}
      onOpenChange={setOpen}
      zodKey={zodKey}
      fileId={fileId}
      setValue={setValue}
      getValues={getValues}
    >
      {inlineInput}
    </StringExpandPopover>
  );
}

TableStringField.displayName = "TableStringField";

export default TableStringField;
