import { closeModals } from "@/API/GUI-api/modal-api";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, LucideIcon } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import type { ReactNode } from "react";

/**
 * Shared body for the "create <kind> file" modals (markdown, SQL, canvas,
 * drawio): one name input with live validation, error display, and the
 * Cancel/Create footer. Each concrete modal supplies the header texts and the
 * create action; extra controls (e.g. the canvas suffix select) slot in next
 * to the input via `inputExtra`.
 */

const MAX_NAME_LENGTH = 255;
// Windows-invalid filename characters plus control chars. Hyphens and interior
// spaces are legal; leading/trailing whitespace is rejected separately below.
// eslint-disable-next-line no-control-regex
const INVALID_CHARS = /[<>:"/\\|?*\u0000-\u001f]/;
const RESERVED_NAMES = [
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
];

interface ValidationError {
  type: "empty" | "invalid_chars" | "too_long" | "reserved" | "whitespace";
  message: string;
}

function validateFileName(name: string): ValidationError | null {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { type: "empty", message: "File name cannot be empty" };
  }
  if (trimmedName !== name) {
    return {
      type: "whitespace",
      message: "File name cannot start or end with spaces",
    };
  }
  if (trimmedName.length > MAX_NAME_LENGTH) {
    return {
      type: "too_long",
      message: `File name cannot exceed ${MAX_NAME_LENGTH} characters`,
    };
  }
  if (INVALID_CHARS.test(trimmedName)) {
    return {
      type: "invalid_chars",
      message: 'File name contains invalid characters: < > : " / \\ | ? *',
    };
  }
  if (RESERVED_NAMES.includes(trimmedName.toUpperCase())) {
    return {
      type: "reserved",
      message: `"${trimmedName}" is a reserved name and cannot be used`,
    };
  }
  return null;
}

export interface CreateFileModalProps {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  /** htmlFor/id pairing the label with the input. */
  inputId: string;
  placeholder: string;
  /** Message shown when `onCreate` throws. */
  failureMessage: string;
  /** Creates the file; the trimmed, validated name is passed in. */
  onCreate: (name: string) => Promise<void> | void;
  /** Optional control rendered beside the input (e.g. a suffix select). */
  inputExtra?: ReactNode;
}

function CreateFileModal({
  icon: Icon,
  title,
  description,
  inputId,
  placeholder,
  failureMessage,
  onCreate,
  inputExtra,
}: CreateFileModalProps) {
  const [fileName, setFileName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] =
    useState<ValidationError | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setFileName(value);
      setError(null);
      setValidationError(validateFileName(value));
    },
    []
  );

  const handleCreateFile = useCallback(async () => {
    const validation = validateFileName(fileName);
    if (validation) {
      setValidationError(validation);
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      await onCreate(fileName.trim());
      closeModals();
    } catch (err) {
      setError(failureMessage);
      console.error(`Error creating file (${title}):`, err);
    } finally {
      setIsCreating(false);
    }
  }, [fileName, onCreate, failureMessage, title]);

  const handleFormSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (!validationError && fileName.trim() && !isCreating) {
        handleCreateFile();
      }
    },
    [validationError, fileName, isCreating, handleCreateFile]
  );

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      closeModals();
    }
  }, []);

  const isFormValid = !validationError && fileName.trim() && !isCreating;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={inputId}>File Name</Label>
          <div className="flex gap-2">
            <Input
              id={inputId}
              ref={inputRef}
              value={fileName}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={validationError ? "border-destructive" : ""}
              disabled={isCreating}
              maxLength={MAX_NAME_LENGTH}
            />
            {inputExtra}
          </div>

          {validationError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{validationError.message}</span>
            </div>
          )}

          {fileName.length > MAX_NAME_LENGTH * 0.8 && (
            <div className="text-xs text-muted-foreground text-right">
              {fileName.length}/{MAX_NAME_LENGTH} characters
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </form>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" onClick={closeModals} disabled={isCreating}>
            Cancel
          </Button>
        </DialogClose>

        <Button
          onClick={handleCreateFile}
          disabled={!isFormValid}
          className="min-w-[120px]"
        >
          {isCreating ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              Creating...
            </div>
          ) : (
            "Create File"
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

export default CreateFileModal;
