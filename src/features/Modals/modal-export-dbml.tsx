import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ImageDown, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ExportBackground,
  ExportFormat,
  getDiagramSize,
  injectBackground,
  resolveBackgroundColor,
} from "@/lib/canvas/export-image.core";
import {
  DBML_DARK_PALETTE,
  DBML_LIGHT_PALETTE,
  renderDbmlDiagramSvg,
  stripDbmlExtension,
} from "@/lib/dbml/dbml-export.core";
import { parseDbml, fkColumnsByTable } from "@/lib/dbml/dbml-parser.core";
import {
  autoLayoutTables,
  computeContentBounds,
  computeGroupBounds,
  placeUnpositionedTables,
} from "@/lib/dbml/dbml-layout.core";
import { readDbmlLayout } from "@/lib/dbml/dbml-layout-store";
import { addErrorMessage, addOutputMessage } from "@/API/GUI-api/status-panel-api";

type ModalExportDbmlProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  fileName: string;
  fileId: string;
};

const SCALES = [1, 2, 3, 4];

// The export renders the diagram fresh from `content` + the persisted sidecar
// layout, independent of the live DbmlEditor pane's in-memory state — same
// self-sufficiency as ModalExportCanvas (re-derives from `content` via
// mermaid.render rather than sharing state with canvas-editor.tsx). Pan/zoom
// and search highlighting are view-only and never affect the export; "keys
// only" and collapsed groups are persisted view settings, so they do carry
// over.
function ModalExportDbml({ open, onOpenChange, content, fileName, fileId }: ModalExportDbmlProps) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [scale, setScale] = useState(2);
  const [background, setBackground] = useState<ExportBackground>("transparent");
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [exportTheme, setExportTheme] = useState<"light" | "dark">(
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  useEffect(() => {
    if (!open) return;
    setExportTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, [open]);

  const { schema, error } = useMemo(() => (open ? parseDbml(content) : { schema: null, error: null }), [open, content]);

  const [savedLayout, setSavedLayout] = useState<Awaited<ReturnType<typeof readDbmlLayout>>>(null);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void readDbmlLayout(fileId).then((layout) => {
      if (!cancelled) setSavedLayout(layout);
    });
    return () => {
      cancelled = true;
    };
  }, [open, fileId]);

  const positions = useMemo(() => {
    if (!schema) return {};
    return savedLayout ? placeUnpositionedTables(schema, savedLayout.tables) : autoLayoutTables(schema);
  }, [schema, savedLayout]);

  const bounds = useMemo(
    () => (schema ? computeContentBounds(schema, positions) : { minX: 0, minY: 0, width: 0, height: 0 }),
    [schema, positions]
  );
  const groupBounds = useMemo(() => (schema ? computeGroupBounds(schema, positions) : {}), [schema, positions]);
  const fkByTable = useMemo(
    () => (schema ? fkColumnsByTable(schema) : new Map<string, Set<string>>()),
    [schema]
  );

  const collapsedGroupNames = useMemo(() => {
    const names = new Set<string>();
    if (!schema || !savedLayout) return names;
    for (const group of schema.groups) {
      if (savedLayout.groups?.[group.name]?.collapsed) names.add(group.name);
    }
    return names;
  }, [schema, savedLayout]);

  const hiddenTableNames = useMemo(() => {
    const hidden = new Set<string>();
    if (!schema) return hidden;
    for (const group of schema.groups) {
      if (collapsedGroupNames.has(group.name)) {
        for (const t of group.tables) hidden.add(t);
      }
    }
    return hidden;
  }, [schema, collapsedGroupNames]);

  const showOnlyPkFk = savedLayout?.viewSettings?.showOnlyPkFk ?? false;

  const backgroundColor = useMemo(
    () => resolveBackgroundColor(background, exportTheme === "dark"),
    [background, exportTheme]
  );

  const previewSvg = useMemo(() => {
    if (!schema) return "";
    const palette = exportTheme === "dark" ? DBML_DARK_PALETTE : DBML_LIGHT_PALETTE;
    const svg = renderDbmlDiagramSvg({
      schema,
      positions,
      groupBounds,
      collapsedGroupNames,
      hiddenTableNames,
      fkColumnsByTable: fkByTable,
      showOnlyPkFk,
      bounds,
      palette,
    });
    return backgroundColor ? injectBackground(svg, backgroundColor) : svg;
  }, [
    schema,
    positions,
    groupBounds,
    collapsedGroupNames,
    hiddenTableNames,
    fkByTable,
    showOnlyPkFk,
    bounds,
    exportTheme,
    backgroundColor,
  ]);

  const size = useMemo(() => (previewSvg ? getDiagramSize(previewSvg) : null), [previewSvg]);

  const baseName = useMemo(() => stripDbmlExtension(fileName), [fileName]);

  const renderError = !schema
    ? error
      ? `${error.line ? `Line ${error.line}: ` : ""}${error.message}`
      : "Diagram is empty — nothing to export."
    : null;

  const handleExport = useCallback(async () => {
    if (!previewSvg) return;
    setIsExporting(true);
    setExportError(null);
    try {
      // The serializer always emits explicit width/height (unlike Mermaid's
      // percentage-sized output), so no separate size-pinning pass is needed
      // for either format — see renderDbmlDiagramSvg in dbml-export.core.ts.
      const savedPath = await window.project.exportImage({
        defaultFileName: `${baseName}.${format}`,
        format,
        svg: previewSvg,
        scale,
        background: backgroundColor,
      });
      if (savedPath) {
        addOutputMessage(`Exported diagram to ${savedPath}`);
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Failed to export diagram:", err);
      setExportError("Failed to export the diagram. Please try again.");
      addErrorMessage("Failed to export the diagram.", "error");
    } finally {
      setIsExporting(false);
    }
  }, [previewSvg, format, backgroundColor, scale, baseName, onOpenChange]);

  const canExport = !!previewSvg && !renderError && !isExporting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[60vw] max-w-[60vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageDown className="h-5 w-5" />
            Export Diagram
          </DialogTitle>
          <DialogDescription>
            Choose a format and options, preview the result, then pick where to save it.
          </DialogDescription>
        </DialogHeader>

        <div
          className="flex h-[50vh] items-center justify-center overflow-auto rounded-md border"
          style={
            backgroundColor
              ? { background: backgroundColor }
              : {
                  backgroundImage:
                    "linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                }
          }
        >
          {renderError ? (
            <div className="flex items-center gap-2 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{renderError}</span>
            </div>
          ) : previewSvg ? (
            <div
              className="max-h-full max-w-full [&_svg]:max-h-[46vh] [&_svg]:max-w-full"
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="inline-flex w-full -space-x-px">
              {(["light", "dark"] as const).map((t) => (
                <Button
                  key={t}
                  type="button"
                  size="sm"
                  variant={exportTheme === t ? "default" : "outline"}
                  className="flex-1 rounded-none capitalize first:rounded-s-md last:rounded-e-md"
                  onClick={() => setExportTheme(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Format</Label>
            <div className="inline-flex w-full -space-x-px">
              {(["png", "svg"] as ExportFormat[]).map((f) => (
                <Button
                  key={f}
                  type="button"
                  size="sm"
                  variant={format === f ? "default" : "outline"}
                  className="flex-1 rounded-none first:rounded-s-md last:rounded-e-md"
                  onClick={() => setFormat(f)}
                >
                  {f.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Background</Label>
            <div className="inline-flex w-full -space-x-px">
              {(["transparent", "solid"] as ExportBackground[]).map((b) => (
                <Button
                  key={b}
                  type="button"
                  size="sm"
                  variant={background === b ? "default" : "outline"}
                  className="flex-1 rounded-none first:rounded-s-md last:rounded-e-md"
                  onClick={() => setBackground(b)}
                >
                  {b === "transparent" ? "Transparent" : exportTheme === "dark" ? "Dark" : "White"}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Scale {format === "svg" && "(PNG only)"}</Label>
            <div className="inline-flex w-full -space-x-px">
              {SCALES.map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={scale === s ? "default" : "outline"}
                  disabled={format === "svg"}
                  className="flex-1 rounded-none first:rounded-s-md last:rounded-e-md"
                  onClick={() => setScale(s)}
                >
                  {s}×
                </Button>
              ))}
            </div>
          </div>
        </div>

        {size && (
          <p className="text-xs text-muted-foreground">
            {format === "png"
              ? `Output: ${Math.round(size.width * scale)} × ${Math.round(size.height * scale)} px`
              : `Output: scalable vector (${Math.round(size.width)} × ${Math.round(size.height)} px viewBox)`}
          </p>
        )}

        {exportError && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{exportError}</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={!canExport} className="min-w-[120px]">
            {isExporting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </span>
            ) : (
              "Export"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ModalExportDbml;
