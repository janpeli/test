import { closeModals, createModelFromModal } from "@/API/GUI-api/modal-api";
import { selectProjectPlugins } from "@/API/project-api/project-api.selectors";
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
import { useAppSelector } from "@/hooks/hooks";
import { Plugin } from "electron/src/project";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Combobox } from "@/components/ui/combobox";
import { AlertCircle, Box, Plus } from "lucide-react";

// Constants for validation
const MAX_MODEL_NAME_LENGTH = 100;
const INVALID_CHARS = /[<>:"/\\|?*]/;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x1f]/;

interface ValidationError {
  field: "modelName" | "plugin";
  message: string;
}

interface ComboboxOption {
  value: string;
  label: string;
}

function ModalCreateNewModel() {
  const [modelName, setModelName] = useState("");
  const [selectedPluginUUID, setSelectedPluginUUID] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  const plugins: Plugin[] = useAppSelector(selectProjectPlugins);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Memoize plugin options
  const pluginOptions: ComboboxOption[] = useMemo(() => {
    if (!plugins?.length) return [];
    return plugins.map((plugin) => ({
      value: plugin.uuid,
      label: plugin.name,
    }));
  }, [plugins]);

  // Get selected plugin info for display
  const selectedPlugin = useMemo(
    () => plugins.find((p) => p.uuid === selectedPluginUUID),
    [plugins, selectedPluginUUID]
  );

  // Validate form inputs
  const validateForm = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
    const trimmedName = modelName.trim();

    // Validate model name
    if (!trimmedName) {
      errors.push({ field: "modelName", message: "Model name is required" });
    } else if (trimmedName.length > MAX_MODEL_NAME_LENGTH) {
      errors.push({
        field: "modelName",
        message: `Model name cannot exceed ${MAX_MODEL_NAME_LENGTH} characters`,
      });
    } else if (
      INVALID_CHARS.test(trimmedName) ||
      CONTROL_CHARS.test(trimmedName)
    ) {
      errors.push({
        field: "modelName",
        message: "Model name contains invalid characters",
      });
    }

    // Validate plugin selection
    if (!selectedPluginUUID) {
      errors.push({ field: "plugin", message: "Please select a plugin" });
    }

    return errors;
  }, [modelName, selectedPluginUUID]);

  // Handle model name input change
  const handleModelNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setModelName(value);
      setError(null);

      // Clear validation errors for this field
      setValidationErrors((prev) =>
        prev.filter((err) => err.field !== "modelName")
      );
    },
    []
  );

  // Handle plugin selection change
  const handlePluginChange = useCallback((value: string) => {
    setSelectedPluginUUID(value);
    setError(null);

    // Clear validation errors for this field
    setValidationErrors((prev) => prev.filter((err) => err.field !== "plugin"));
  }, []);

  // Handle model creation
  const handleCreateModel = useCallback(async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsCreating(true);
    setError(null);
    setValidationErrors([]);

    try {
      await createModelFromModal(modelName.trim(), selectedPluginUUID);
      closeModals();
    } catch (err) {
      setError("Failed to create model. Please try again.");
      console.error("Error creating model:", err);
    } finally {
      setIsCreating(false);
    }
  }, [modelName, selectedPluginUUID, validateForm]);

  // Handle form submission
  const handleFormSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (!isCreating) {
        handleCreateModel();
      }
    },
    [isCreating, handleCreateModel]
  );

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      closeModals();
    }
  }, []);

  const isFormValid = modelName.trim() && selectedPluginUUID && !isCreating;
  const modelNameError = validationErrors.find(
    (err) => err.field === "modelName"
  );
  const pluginError = validationErrors.find((err) => err.field === "plugin");

  // Show message if no plugins are available
  if (!plugins || plugins.length === 0) {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Box className="h-5 w-5" />
            Create New Model
          </DialogTitle>
          <DialogDescription>
            Create a new model using an available plugin
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Plugins Available</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You need to install at least one plugin before creating a model.
          </p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" onClick={closeModals}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Box className="h-5 w-5" />
          Create New Model
        </DialogTitle>
        <DialogDescription>
          Enter a name for your model and select the plugin to use
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        {/* Model Name Input */}
        <div className="space-y-2">
          <Label htmlFor="model-name">Model Name</Label>
          <Input
            id="model-name"
            ref={inputRef}
            value={modelName}
            onChange={handleModelNameChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter model name..."
            className={modelNameError ? "border-destructive" : ""}
            disabled={isCreating}
            maxLength={MAX_MODEL_NAME_LENGTH}
          />

          {modelNameError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{modelNameError.message}</span>
            </div>
          )}

          {/* Character count for long names */}
          {modelName.length > MAX_MODEL_NAME_LENGTH * 0.8 && (
            <div className="text-xs text-muted-foreground text-right">
              {modelName.length}/{MAX_MODEL_NAME_LENGTH} characters
            </div>
          )}
        </div>

        {/* Plugin Selection */}
        <div className="space-y-2">
          <Label htmlFor="plugin-select">Plugin</Label>
          <Combobox
            options={pluginOptions}
            value={selectedPluginUUID}
            onValueChange={handlePluginChange}
            placeholder="Select a plugin..."
            disabled={isCreating}
            className={pluginError ? "border-destructive" : ""}
          />

          {pluginError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{pluginError.message}</span>
            </div>
          )}

          {/* Show selected plugin info */}
          {selectedPlugin && (
            <div className="text-sm text-muted-foreground">
              Using plugin:{" "}
              <span className="font-medium">{selectedPlugin.name}</span>
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
          onClick={handleCreateModel}
          disabled={!isFormValid}
          className="min-w-[120px]"
        >
          {isCreating ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              Creating...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Model
            </div>
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

export default ModalCreateNewModel;
