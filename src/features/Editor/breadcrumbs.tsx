import { selectOpenFile } from "@/API/editor-api/editor-api.slice";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAppSelector } from "@/hooks/hooks";

function Breadcrumbs() {
  const openFile = useAppSelector(selectOpenFile);
  const breadcrumbs = openFile?.id ? openFile.id.split("\\") : [];

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
    <Breadcrumb className="h-5 pl-2">
      <BreadcrumbList>
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
