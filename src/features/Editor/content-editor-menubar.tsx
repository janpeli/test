import {
  saveEditedFile,
  setActiveProduct,
  toggleFileView,
} from "@/API/editor-api/editor-api";
import {
  selectOpenFile,
  selectOpenFileActiveProduct,
  selectOpenFileActiveViews,
  selectOpenFileCanvasConfig,
  selectOpenFileContent,
  selectOpenFileProducts,
} from "@/API/editor-api/editor-api.selectors";
import { EditorModeType } from "@/API/editor-api/editor-api.slice";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import { ChevronDown, History, ImageDown, Save } from "lucide-react";
import { useState } from "react";
import ModalExportCanvas from "@/features/Modals/modal-export-canvas";
import { setCanvasConfig } from "@/lib/canvas/canvas-frontmatter";

// Mermaid `layout` config values this app exposes, persisted into the canvas
// file's own frontmatter (see mermaid-frontmatter.core.ts). `undefined`
// clears the key — Mermaid's implicit default (dagre) applies.
const LAYOUT_OPTIONS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: "Dagre" },
  { value: "elk", label: "ELK — Layered" },
  { value: "elk.stress", label: "ELK — Stress" },
  { value: "elk.force", label: "ELK — Force" },
  { value: "elk.mrtree", label: "ELK — Tree" },
  { value: "elk.sporeOverlap", label: "ELK — Overlap Removal" },
];

// Mermaid `theme` config values. `undefined` ("Auto") clears the key so the
// canvas keeps following the app's light/dark mode, same as today.
const THEME_OPTIONS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: "Auto" },
  { value: "default", label: "Default" },
  { value: "dark", label: "Dark" },
  { value: "forest", label: "Forest" },
  { value: "neutral", label: "Neutral" },
  { value: "base", label: "Base" },
  { value: "neo", label: "Neo" },
  { value: "neo-dark", label: "Neo Dark" },
  { value: "redux", label: "Redux" },
  { value: "redux-color", label: "Redux Color" },
  { value: "redux-dark", label: "Redux Dark" },
  { value: "redux-dark-color", label: "Redux Dark Color" },
];

type ContentEditorMenubarProps = {
  editorIdx: number;
};

function ContentEditorMenubar({ editorIdx }: ContentEditorMenubarProps) {
  const openFile = useAppSelectorWithParams(selectOpenFile, { editorIdx });
  const activeViews =
    useAppSelectorWithParams(selectOpenFileActiveViews, { editorIdx }) ?? [];
  const products = useAppSelectorWithParams(selectOpenFileProducts, {
    editorIdx,
  });
  const activeProduct = useAppSelectorWithParams(selectOpenFileActiveProduct, {
    editorIdx,
  });
  const content = useAppSelectorWithParams(selectOpenFileContent, { editorIdx });
  const canvasConfig = useAppSelectorWithParams(selectOpenFileCanvasConfig, {
    editorIdx,
  });

  const [exportOpen, setExportOpen] = useState(false);
  const canvasActive = activeViews.includes("CANVAS");

  const activeLayoutLabel =
    LAYOUT_OPTIONS.find((o) => o.value === canvasConfig.layout)?.label ??
    canvasConfig.layout ??
    "Dagre";
  const activeThemeLabel =
    THEME_OPTIONS.find((o) => o.value === canvasConfig.theme)?.label ??
    canvasConfig.theme ??
    "Auto";

  // PRODUCT is one mode backing N products, so it gets a dropdown rather than a
  // plain toggle. Render the other modes as toggles.
  const availableModes: EditorModeType[] = (openFile?.modes ?? []).filter(
    (mode) => mode !== "PRODUCT"
  );
  const hasProductMode = (openFile?.modes ?? []).includes("PRODUCT");
  const productActive = activeViews.includes("PRODUCT");

  const handleToggle = (view: EditorModeType) => {
    if (!openFile) return;
    toggleFileView(openFile.id, view);
  };

  // Selecting a product opens the pane on it; re-selecting the visible product
  // hides the pane (toggle parity with the other view buttons).
  const handleSelectProduct = (productName: string) => {
    if (!openFile) return;
    if (productActive && activeProduct?.name === productName) {
      toggleFileView(openFile.id, "PRODUCT");
      return;
    }
    setActiveProduct(openFile.id, productName);
    if (!productActive) toggleFileView(openFile.id, "PRODUCT");
  };

  // Segmented-control item styling shared by the view toggles.
  const segItem =
    "rounded-none border-0 border-l border-border first:border-l-0 shadow-none h-[21px] px-2.5 text-[10.5px] font-medium tracking-wide text-muted-foreground hover:bg-accent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";

  return (
    <div className="flex flex-row items-center justify-between h-[30px] border-b border-border bg-card px-2 gap-2">
      <div className="inline-flex items-stretch h-[21px] rounded-[5px] border border-border overflow-hidden">
        {availableModes.map((mode) => (
          <Toggle
            key={mode}
            size="sm"
            className={segItem}
            pressed={activeViews.includes(mode)}
            onPressedChange={() => handleToggle(mode)}
          >
            {mode}
          </Toggle>
        ))}

        {hasProductMode && products.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Toggle
                size="sm"
                className={`${segItem} gap-1`}
                pressed={productActive}
                // Keep Radix's toggle from swallowing the click before the menu opens.
                onPressedChange={() => {}}
              >
                {productActive && activeProduct
                  ? `PRODUCT: ${activeProduct.name}`
                  : "PRODUCT"}
                <ChevronDown className="h-[11px] w-[11px]" />
              </Toggle>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {products.map((product) => (
                <DropdownMenuCheckboxItem
                  key={product.name}
                  checked={productActive && activeProduct?.name === product.name}
                  onSelect={(e) => {
                    e.preventDefault();
                    handleSelectProduct(product.name);
                  }}
                >
                  {product.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {openFile && (
          <Toggle
            variant="outline"
            size="sm"
            className="h-[21px] px-2 text-[11px] gap-1 text-muted-foreground"
            title="Show git history for this file"
            pressed={activeViews.includes("HISTORY")}
            onPressedChange={() => toggleFileView(openFile.id, "HISTORY")}
          >
            <History className="h-[13px] w-[13px]" />
            History
          </Toggle>
        )}

        {canvasActive && openFile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-[21px] px-2 gap-1 text-[11px] text-muted-foreground"
                title="Diagram layout engine"
              >
                Layout: {activeLayoutLabel}
                <ChevronDown className="h-[11px] w-[11px]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
              {LAYOUT_OPTIONS.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.label}
                  checked={canvasConfig.layout === option.value}
                  onSelect={(e) => {
                    e.preventDefault();
                    setCanvasConfig(openFile.id, { layout: option.value });
                  }}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {canvasActive && openFile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-[21px] px-2 gap-1 text-[11px] text-muted-foreground"
                title="Diagram theme"
              >
                Theme: {activeThemeLabel}
                <ChevronDown className="h-[11px] w-[11px]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
              {THEME_OPTIONS.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.label}
                  checked={canvasConfig.theme === option.value}
                  onSelect={(e) => {
                    e.preventDefault();
                    setCanvasConfig(openFile.id, { theme: option.value });
                  }}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {canvasActive && openFile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-[21px] w-[21px] text-muted-foreground"
            title="Export diagram"
            onClick={() => setExportOpen(true)}
          >
            <ImageDown className="h-[15px] w-[15px]" />
            <span className="sr-only">Export diagram</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-[21px] w-[21px] text-muted-foreground"
          title="Save file"
          onClick={async () => {
            await saveEditedFile(openFile?.id as string);
          }}
        >
          <Save className="h-[15px] w-[15px]" />
          <span className="sr-only">Save file</span>
        </Button>
      </div>

      {openFile && (
        <ModalExportCanvas
          open={exportOpen}
          onOpenChange={setExportOpen}
          content={content ?? ""}
          fileName={openFile.name}
        />
      )}
    </div>
  );
}

export default ContentEditorMenubar;
