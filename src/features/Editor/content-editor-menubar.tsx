import {
  saveEditedFile,
  setActiveProduct,
  toggleFileView,
} from "@/API/editor-api/editor-api";
import {
  selectOpenFile,
  selectOpenFileActiveProduct,
  selectOpenFileActiveViews,
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
import { ChevronDown, Save } from "lucide-react";

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

  return (
    <div className="flex flex-row justify-start h-8 border-b items-center gap-1 p-1">
      <div className="inline-flex gap-0 -space-x-px rounded-lg shadow-sm shadow-black/5 rtl:space-x-reverse pl-1">
        {availableModes.map((mode) => (
          <Toggle
            key={mode}
            variant="outline"
            size="sm"
            className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 h-6 px-2 text-xs"
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
                variant="outline"
                size="sm"
                className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 h-6 px-2 text-xs gap-1"
                pressed={productActive}
                // Keep Radix's toggle from swallowing the click before the menu opens.
                onPressedChange={() => {}}
              >
                {productActive && activeProduct
                  ? `PRODUCT: ${activeProduct.name}`
                  : "PRODUCT"}
                <ChevronDown className="h-3 w-3" />
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

      <Button
        variant="ghost"
        size="icon"
        onClick={async () => {
          await saveEditedFile(openFile?.id as string);
        }}
      >
        <Save className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Save file</span>
      </Button>
    </div>
  );
}

export default ContentEditorMenubar;
