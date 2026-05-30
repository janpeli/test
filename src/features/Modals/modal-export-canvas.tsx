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
  pinSvgSize,
  prepareSvgString,
  renderDiagramSvg,
  stripCanvasExtension,
} from "@/lib/canvas/export-image";
import {
  addErrorMessage,
  addOutputMessage,
} from "@/API/GUI-api/status-panel-api";

type ModalExportCanvasProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  fileName: string;
};

const SCALES = [1, 2, 3, 4];

function ModalExportCanvas({
  open,
  onOpenChange,
  content,
  fileName,
}: ModalExportCanvasProps) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [scale, setScale] = useState(2);
  const [background, setBackground] = useState<ExportBackground>("transparent");
  const [previewSvg, setPreviewSvg] = useState<string>("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Render the diagram to SVG for the live preview whenever the source or theme
  // changes while the dialog is open.
  useEffect(() => {
    if (!open) return;
    const source = content.trim();
    if (!source) {
      setPreviewSvg("");
      setRenderError("Canvas is empty — nothing to export.");
      return;
    }
    let cancelled = false;
    renderDiagramSvg(source, isDark)
      .then((svg) => {
        if (cancelled) return;
        setPreviewSvg(svg);
        setRenderError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setPreviewSvg("");
        setRenderError("Invalid diagram syntax — fix the canvas before exporting.");
      });
    return () => {
      cancelled = true;
    };
  }, [open, content, isDark]);

  const size = useMemo(
    () => (previewSvg ? getDiagramSize(previewSvg) : null),
    [previewSvg]
  );

  const baseName = useMemo(() => stripCanvasExtension(fileName), [fileName]);

  const handleExport = useCallback(async () => {
    if (!previewSvg) return;
    setIsExporting(true);
    setExportError(null);
    try {
      // Send the SVG markup to the main process. Both paths ship a size-pinned
      // SVG; SVG export bakes in the chosen background, while PNG export leaves
      // sizing/background to resvg (scale -> fitTo zoom, background -> fill).
      const { width, height } = getDiagramSize(previewSvg);
      const svg =
        format === "svg"
          ? prepareSvgString(previewSvg, background)
          : pinSvgSize(previewSvg, width, height);

      const savedPath = await window.project.exportImage({
        defaultFileName: `${baseName}.${format}`,
        format,
        svg,
        scale,
        background,
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
  }, [previewSvg, format, background, scale, baseName, onOpenChange]);

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
            Choose a format and options, preview the result, then pick where to
            save it.
          </DialogDescription>
        </DialogHeader>

        {/* Preview */}
        <div
          className="flex h-[50vh] items-center justify-center overflow-auto rounded-md border"
          style={
            background === "white"
              ? { background: "#ffffff" }
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

        {/* Options */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              {(["transparent", "white"] as ExportBackground[]).map((b) => (
                <Button
                  key={b}
                  type="button"
                  size="sm"
                  variant={background === b ? "default" : "outline"}
                  className="flex-1 rounded-none capitalize first:rounded-s-md last:rounded-e-md"
                  onClick={() => setBackground(b)}
                >
                  {b}
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
              ? `Output: ${Math.round(size.width * scale)} × ${Math.round(
                  size.height * scale
                )} px`
              : `Output: scalable vector (${Math.round(size.width)} × ${Math.round(
                  size.height
                )} px viewBox)`}
          </p>
        )}

        {exportError && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{exportError}</span>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!canExport}
            className="min-w-[120px]"
          >
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

export default ModalExportCanvas;
