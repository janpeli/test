import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { SidebarNav } from "./sidebar-nav";

export function EditorFormLayout({
  children,
  schemaObject,
}: {
  children: React.ReactNode;
  schemaObject: JSONSchema;
}) {
  const tabs: Array<{
    title: string;
  }> = [];

  if (schemaObject.properties) {
    for (const [key, value] of Object.entries(schemaObject.properties)) {
      tabs.push({
        title: value.description ? value.description : key,
      });
    }
  }
  return (
    <div className="flex flex-col space-y-4 lg:flex-row lg:space-x-12 lg:space-y-0 bg-primary-foreground min-w-min">
      <aside className="m-4">
        <SidebarNav items={tabs} defaultItem={tabs[0].title} />
      </aside>
      <div className="flex-1 p-1">{children}</div>
    </div>
  );
}
