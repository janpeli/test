import { closeModals, createCanvasFromModal } from "@/API/GUI-api/modal-api";
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
import { AlertCircle, BarChart2 } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";

const MAX_NAME_LENGTH = 255;
const INVALID_CHARS = /[<>:"/\\|?* -]/;
const RESERVED_NAMES = [
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
];

interface ValidationError {
  type: "empty" | "invalid_chars" | "too_long" | "reserved" | "whitespace";
  message: string;
}

function ModalCreateNewCanvas() {
  const [fileName, setFileName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<ValidationError | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const validateFileName = useCallback((name: string): ValidationError | null => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { type: "empty", message: "File name cannot be empty" };
    }
    if (trimmedName !== name) {
      return { type: "whitespace", message: "File name cannot start or end with spaces" };
    }
    if (trimmedName.length > MAX_NAME_LENGTH) {
      return { type: "too_long", message: `File name cannot exceed ${MAX_NAME_LENGTH} characters` };
    }
    if (INVALID_CHARS.test(trimmedName)) {
      return { type: "invalid_chars", message: 'File name contains invalid characters: < > : " / \\ | ? *' };
    }
    if (RESERVED_NAMES.includes(trimmedName.toUpperCase())) {
      return { type: "reserved", message: `"${trimmedName}" is a reserved name and cannot be used` };
    }
    return null;
  }, []);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFileName(value);
    setError(null);
    setValidationError(validateFileName(value));
  }, [validateFileName]);

  const handleCreateFile = useCallback(async () => {
    const validation = validateFileName(fileName);
    if (validation) {
      setValidationError(validation);
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      await createCanvasFromModal(fileName.trim());
      closeModals();
    } catch (err) {
      setError("Failed to create canvas file. Please try again.");
      console.error("Error creating canvas file:", err);
    } finally {
      setIsCreating(false);
    }
  }, [fileName, validateFileName]);

  const handleFormSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    if (!validationError && fileName.trim() && !isCreating) {
      handleCreateFile();
    }
  }, [validationError, fileName, isCreating, handleCreateFile]);

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
          <BarChart2 className="h-5 w-5" />
          Create New Canvas File
        </DialogTitle>
        <DialogDescription>
          Enter a name for your new Mermaid canvas file (.can.md will be appended)
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="canvas-file-name">File Name</Label>
          <Input
            id="canvas-file-name"
            ref={inputRef}
            value={fileName}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="my-diagram"
            className={validationError ? "border-destructive" : ""}
            disabled={isCreating}
            maxLength={MAX_NAME_LENGTH}
          />

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

        <Button onClick={handleCreateFile} disabled={!isFormValid} className="min-w-[120px]">
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

export default ModalCreateNewCanvas;
