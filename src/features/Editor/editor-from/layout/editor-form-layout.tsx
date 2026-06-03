import { useRef } from "react";
import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { SidebarNav } from "./sidebar-nav";

export function EditorFormLayout({
  children,
  schemaObject,
}: {
  children: React.ReactNode;
  schemaObject: JSONSchema;
}) {
  const asideRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const tabs: Array<{
    key: string;
    title: string;
  }> = [];

  if (schemaObject.properties) {
    for (const [key, value] of Object.entries(schemaObject.properties)) {
      tabs.push({
        key,
        title: value.title ? value.title : key,
      });
    }
  }

  const scrollToSection = (key: string) => {
    const target = contentRef.current?.querySelector<HTMLElement>(
      `[data-form-section="${CSS.escape(key)}"]`
    );
    if (!target) return;

    // Scroll ONLY the form's own scroll container. We must not use
    // target.scrollIntoView(): every ancestor here is overflow-hidden to lock
    // the app shell, and scrollIntoView would still scroll those panes.
    const scroller = getScrollParent(target);
    if (!scroller) return;

    const navOffset = asideRef.current?.offsetHeight ?? 0;
    const top =
      target.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop -
      navOffset;

    scroller.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col bg-primary-foreground min-w-min">
      <aside
        ref={asideRef}
        className="sticky top-0 z-10 border-b bg-primary-foreground px-2 py-1"
      >
        <SidebarNav
          items={tabs}
          defaultItem={tabs[0]?.key}
          onSelect={scrollToSection}
        />
      </aside>
      <div ref={contentRef} className="flex-1 p-1">
        {children}
      </div>
    </div>
  );
}

/** Nearest ancestor that actually scrolls (overflow-y auto/scroll). */
function getScrollParent(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return null;
}
