import {
  saveEditedFile,
  setActiveProduct,
  toggleFileView,
} from "@/API/editor-api/editor-api";
import {
  selectOpenFile,
  selectOpenFileActiveProduct,
  selectOpenFileActiveViews,
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

  const [exportOpen, setExportOpen] = useState(false);
  const canvasActive = activeViews.includes("CANVAS");

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
