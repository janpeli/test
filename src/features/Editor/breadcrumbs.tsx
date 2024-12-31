import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type BreadcrumbsProps = {
  id: string;
};

function Breadcrumbs(props: BreadcrumbsProps) {
  const path = props.id.split("\\");
  const fileName = path[path.length - 1];

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
        {path.slice(0, path.length - 1).map((item) => {
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
