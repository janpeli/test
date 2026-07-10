import { useEffect, useRef } from "react";
import {
  Control,
  FieldValues,
  UseFormGetValues,
  UseFormSetValue,
  useWatch,
} from "react-hook-form";
import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { addErrorMessage } from "@/API/GUI-api/status-panel-api";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";
import { store } from "@/app/store";

/**
 * Runs `onDisable` when `disabled` transitions from false/undefined to true —
 * but never on the mount that follows a fresh file open. A field can already
 * be disabled the moment a file is opened (e.g. a `valid_for` condition unmet
 * by the object's saved data); clearing it then would mark a freshly opened,
 * unedited file dirty.
 *
 * A disable transition is not always visible as a prop change, though: an
 * external write (SOURCE→FORM sync, undo/redo, save reconcile) bumps
 * `formSync[fileId]`, which remounts the whole form, so a field disabled by
 * a Monaco edit to its master property mounts already-disabled. That mount
 * must still clear — otherwise the stale value survives into the saved YAML
 * and product rendering. `formSync[fileId]` is bumped only by external writes
 * and removed on file close, so a non-zero version at mount means exactly
 * "remounted after an external write", never "file just opened"; `onDisable`
 * fires on those mounts too. `onDisable` must therefore be idempotent (all
 * callers are: they re-clear an already-cleared value).
 *
 * Tracks the *previous* value of `disabled` rather than a "have I mounted"
 * boolean flag: React.StrictMode double-invokes effects on mount in dev, and
 * a boolean flag flips to true on the first of those two synchronous
 * invocations, making the second one (still the same initial mount) look
 * like a real transition. Comparing against the previous value converges to
 * a no-op on the second invocation instead.
 */
export const useClearWhenDisabled = (
  disabled: boolean | undefined,
  fileId: string,
  onDisable: () => void
) => {
  const prevDisabled = useRef(disabled);
  useEffect(() => {
    const wasDisabled = prevDisabled.current;
    prevDisabled.current = disabled;
    const externallyRemounted = (store.getState().formSync[fileId] ?? 0) > 0;
    if (disabled && (!wasDisabled || externallyRemounted)) onDisable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);
};

/**
 * The standard clear-on-disable behavior shared by fields without local UI
 * state: remove the value at `zodKey` (+ optional `pathSuffix`, e.g.
 * ".$reference") and commit the form. Fields that mirror their value in
 * local state (boolean, combobox, sub-reference) use {@link
 * useClearWhenDisabled} directly with a custom callback instead.
 */
export const useClearFieldWhenDisabled = (
  {
    disabled,
    fileId,
    zodKey,
    setValue,
    getValues,
  }: {
    disabled: boolean | undefined;
    fileId: string;
    zodKey: string;
    setValue: UseFormSetValue<FieldValues>;
    getValues: UseFormGetValues<FieldValues>;
  },
  pathSuffix = ""
) => {
  const path = zodKey + pathSuffix;
  useClearWhenDisabled(disabled, fileId, () => {
    setValue(path, undefined);
    updateEditorFormDatabyPath(fileId, getValues(), path);
  });
};

function getParentPath(path: string) {
  const keys = path.split(".");
  keys.pop(); // Remove the last key
  return keys.join("."); // Join the remaining keys back into a string
}

// Function to check if a field should be visible based on `valid_for` conditions
export const useFieldDisabled = (
  field: JSONSchema,
  zodKey: string,
  control: Control
): boolean => {
  const parentValue = useWatch({
    control: control,
    name: getParentPath(zodKey),
  });

  const masterProperty = field.valid_for?.property;
  const hasSchemaMismatch = !!(
    masterProperty &&
    field.valid_for?.enum &&
    parentValue &&
    !(masterProperty in parentValue)
  );

  useEffect(() => {
    if (hasSchemaMismatch && masterProperty) {
      addErrorMessage(
        `Schema warning: field "${zodKey}" has valid_for.property "${masterProperty}" which does not exist in the parent object.`,
        "warning"
      );
    }
  }, [hasSchemaMismatch, masterProperty, zodKey]);

  if (field.valid_for && field.valid_for.property && field.valid_for.enum) {
    if (parentValue && !(field.valid_for.property in parentValue)) {
      return false;
    }
    if (
      parentValue &&
      field.valid_for.property in parentValue &&
      parentValue[field.valid_for.property] !== undefined
    ) {
      if (
        parentValue[field.valid_for.property] &&
        field.valid_for.enum.includes(parentValue[field.valid_for.property])
      ) {
        return false;
      }
      return true;
    }
  }
  return false;
};
