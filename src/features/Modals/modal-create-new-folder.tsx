import { closeModals, createFolderFromModal } from "@/API/GUI-api/modal-api";
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
import { AlertCircle, Folder } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";

// Constants for validation
const MAX_FOLDER_NAME_LENGTH = 255;
// eslint-disable-next-line no-control-regex
const INVALID_CHARS = /[<>:"/\\|?*\u0000-\u001f]/;
const RESERVED_NAMES = [
  "CON",
  "PRN",
  "AUX",
  "NUL",
  "COM1",
  "COM2",
  "COM3",
  "COM4",
  "COM5",
  "COM6",
  "COM7",
  "COM8",
  "COM9",
  "LPT1",
  "LPT2",
  "LPT3",
  "LPT4",
  "LPT5",
  "LPT6",
  "LPT7",
  "LPT8",
  "LPT9",
];

interface ValidationError {
  type: "empty" | "invalid_chars" | "too_long" | "reserved" | "whitespace";
  message: string;
}

function ModalCreateNewFolder() {
  const [folderName, setFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] =
    useState<ValidationError | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Validate folder name
  const validateFolderName = useCallback(
    (name: string): ValidationError | null => {
      const trimmedName = name.trim();

      if (!trimmedName) {
        return { type: "empty", message: "Folder name cannot be empty" };
      }

      if (trimmedName !== name) {
        return {
          type: "whitespace",
          message: "Folder name cannot start or end with spaces",
        };
      }

      if (trimmedName.length > MAX_FOLDER_NAME_LENGTH) {
        return {
          type: "too_long",
          message: `Folder name cannot exceed ${MAX_FOLDER_NAME_LENGTH} characters`,
        };
      }

      if (INVALID_CHARS.test(trimmedName)) {
        return {
          type: "invalid_chars",
          message:
            'Folder name contains invalid characters: < > : " / \\ | ? *',
        };
      }

      if (RESERVED_NAMES.includes(trimmedName.toUpperCase())) {
        return {
          type: "reserved",
          message: `"${trimmedName}" is a reserved name and cannot be used`,
        };
      }

      return null;
    },
    []
  );

  // Handle input change with validation
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setFolderName(value);

      // Clear previous errors
      setError(null);

      // Validate input
      const validation = validateFolderName(value);
      setValidationError(validation);
    },
    [validateFolderName]
  );

  // Handle folder creation
  const handleCreateFolder = useCallback(async () => {
    const validation = validateFolderName(folderName);
    if (validation) {
      setValidationError(validation);
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await createFolderFromModal(folderName.trim());
      closeModals();
    } catch (err) {
      setError("Failed to create folder. Please try again.");
      console.error("Error creating folder:", err);
    } finally {
      setIsCreating(false);
    }
  }, [folderName, validateFolderName]);

  // Handle form submission (Enter key)
  const handleFormSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (!validationError && folderName.trim() && !isCreating) {
        handleCreateFolder();
      }
    },
    [validationError, folderName, isCreating, handleCreateFolder]
  );

  // Handle key down for accessibility
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      closeModals();
    }
  }, []);

  const isFormValid = !validationError && folderName.trim() && !isCreating;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Folder className="h-5 w-5" />
          Create New Folder
        </DialogTitle>
        <DialogDescription>Enter a name for your new folder</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="folder-name">Folder Name</Label>
          <Input
            id="folder-name"
            ref={inputRef}
            value={folderName}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter folder name..."
            className={validationError ? "border-destructive" : ""}
            disabled={isCreating}
            maxLength={MAX_FOLDER_NAME_LENGTH}
          />

          {/* Validation error display */}
          {validationError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{validationError.message}</span>
            </div>
          )}

          {/* Character count for long names */}
          {folderName.length > MAX_FOLDER_NAME_LENGTH * 0.8 && (
            <div className="text-xs text-muted-foreground text-right">
              {folderName.length}/{MAX_FOLDER_NAME_LENGTH} characters
            </div>
          )}
        </div>

        {/* General error display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </form>

      <DialogFooter>
        <DialogClose asChild>
          <Button
            variant="secondary"
            onClick={closeModals}
            disabled={isCreating}
          >
            Cancel
          </Button>
        </DialogClose>

        <Button
          onClick={handleCreateFolder}
          disabled={!isFormValid}
          className="min-w-[120px]"
        >
          {isCreating ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              Creating...
            </div>
          ) : (
            "Create Folder"
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

export default ModalCreateNewFolder;
