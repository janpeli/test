import { selectOpenFile } from "@/API/editor-api/editor-api.selectors";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAppSelectorWithParams } from "@/hooks/hooks";

type BreadcrumbProps = {
  editorIdx: number;
};

function Breadcrumbs({ editorIdx }: BreadcrumbProps) {
  const openFile = useAppSelectorWithParams(selectOpenFile, { editorIdx });
  const breadcrumbs = openFile?.id ? openFile.id.split("/") : [];

  const fileName = breadcrumbs ? breadcrumbs[breadcrumbs.length - 1] : "";

  function Item({ item }: { item: string }) {
    return (
      <>
        <BreadcrumbItem key={item + "#item"}>
          <BreadcrumbLink key={item}>{item}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator key={item + "#separator"} />
      </>
    );
  }

  return (
    <Breadcrumb className="h-[22px] flex items-center px-2.5 border-b border-border bg-background">
      <BreadcrumbList className="gap-1 font-mono text-[11px] text-faint sm:gap-1">
        {breadcrumbs.slice(0, breadcrumbs.length - 1).map((item) => {
          return <Item key={item} item={item} />;
        })}
        <BreadcrumbItem key={fileName}>
          <BreadcrumbPage key={fileName}>{fileName}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default Breadcrumbs;
