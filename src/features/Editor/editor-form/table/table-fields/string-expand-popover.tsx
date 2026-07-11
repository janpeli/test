import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FieldValues,
  UseFormGetValues,
  UseFormSetValue,
} from "react-hook-form";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";

interface StringExpandPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zodKey: string;
  fileId: string;
  setValue: UseFormSetValue<FieldValues>;
  getValues: UseFormGetValues<FieldValues>;
  /** The cell content (inline input + expand affordance) the popover anchors to. */
  children: React.ReactNode;
}

/**
 * Focus-expansion editor for a table string cell. The dense inline <Input> stays
 * the registered react-hook-form field; this popover edits the SAME value in a
 * larger auto-growing textarea. It never writes on keystroke — it commits once,
 * on close (Escape / click-outside / Ctrl|Cmd+Enter), via the sanctioned
 * `updateEditorFormDatabyPath` path (one commit = one undo boundary). It must NOT
 * bump `formSync`, which would remount the whole form mid-edit.
 */
function StringExpandPopover({
  open,
  onOpenChange,
  zodKey,
  fileId,
  setValue,
  getValues,
  children,
}: StringExpandPopoverProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // Seed from the current field value whenever the popover opens, then focus the
  // textarea with the caret at the end. Half-typed YAML can push non-string
  // values into form state, so coerce.
  useEffect(() => {
    if (!open) return;
    const value = getValues(zodKey);
    setText(typeof value === "string" ? value : "");
    const raf = requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
      autoGrow();
    });
    return () => cancelAnimationFrame(raf);
  }, [open, zodKey, getValues, autoGrow]);

  const commit = useCallback(() => {
    const current = getValues(zodKey);
    const currentStr = typeof current === "string" ? current : "";
    if (text === currentStr) return;
    setValue(zodKey, text, { shouldDirty: true });
    updateEditorFormDatabyPath(fileId, getValues(), zodKey);
  }, [text, zodKey, fileId, getValues, setValue]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) commit();
      onOpenChange(next);
    },
    [commit, onOpenChange]
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent
        align="start"
        collisionPadding={16}
        className="p-2"
        style={{
          // Track the cell width, but never below 360px nor beyond the
          // viewport (minus padding) or a sane absolute cap.
          width:
            "min(max(var(--radix-popover-trigger-width), 360px), 560px, calc(100vw - 32px))",
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            autoGrow();
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              handleOpenChange(false);
            }
          }}
          placeholder="…"
          className="max-h-[40vh] min-h-[6rem] resize-none overflow-y-auto"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to save · <kbd>Esc</kbd> to close
        </p>
      </PopoverContent>
    </Popover>
  );
}

StringExpandPopover.displayName = "StringExpandPopover";

export default StringExpandPopover;
