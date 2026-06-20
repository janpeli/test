import { useCallback, useEffect, useRef, useState } from "react";
import { FormSectionTab } from "../../utilities";
import { SidebarNav } from "./sidebar-nav";

/**
 * Section tab bar for the FORM pane. Rendered as a plain flex header *above* the
 * form's scroll container (not inside it) so it can never scroll out of view —
 * we deliberately avoid `position: sticky`, which has to resolve through several
 * nested flex ancestors. Clicking a tab scrolls its section to the top of the
 * scroller; while scrolling, the tab of the section under the top edge is
 * highlighted (scroll-spy).
 *
 * Purely presentational: tabs are derived and gated by the parent
 * (`editor-form-panels.tsx`), which only mounts this for an actual FORM file, so
 * this component never touches the schema.
 *
 * The scroller is shared by every open FORM file (inactive ones are
 * `display:none`), so all DOM lookups are filtered to the visible sections.
 */
export function EditorFormSectionNav({
  tabs,
  scrollerRef,
}: {
  tabs: FormSectionTab[];
  scrollerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined);

  // Only the currently visible (active) file's sections live in the layout; the
  // scroller also holds hidden files, so skip anything with no layout box.
  const visibleSections = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return [];
    return Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-form-section]")
    ).filter((el) => el.offsetParent !== null);
  }, [scrollerRef]);

  // While a click-initiated smooth scroll is animating, scroll-spy is pinned to
  // this key so the highlight doesn't walk through every section the scroll
  // passes. Cleared once the target reaches the top edge (or on `scrollend`).
  const clickTargetRef = useRef<string | null>(null);

  const scrollToSection = useCallback(
    (key: string) => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const target = visibleSections().find(
        (el) => el.dataset.formSection === key
      );
      if (!target) return;

      const top =
        target.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop;
      clickTargetRef.current = Math.abs(scroller.scrollTop - top) > 1 ? key : null;
      scroller.scrollTo({ top, behavior: "smooth" });
    },
    [scrollerRef, visibleSections]
  );

  // Scroll-spy: highlight the last section whose top has passed the scroller's
  // top edge. Reads are coalesced into one rAF per frame so a fast scroll can't
  // trigger a layout-read storm over every section.
  const sectionKeys = tabs.map((t) => t.key).join(" ");
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let rafId = 0;

    const updateActive = () => {
      rafId = 0;
      const sections = visibleSections();
      if (!sections.length) return;
      const threshold = scroller.getBoundingClientRect().top + 4;

      // Keep the clicked tab pinned until its section reaches the top edge.
      const pinned = clickTargetRef.current;
      if (pinned !== null) {
        const target = sections.find((s) => s.dataset.formSection === pinned);
        if (target && target.getBoundingClientRect().top - threshold > 0) {
          setActiveKey(pinned);
          return;
        }
        clickTargetRef.current = null;
      }

      let current = sections[0].dataset.formSection;
      for (const section of sections) {
        if (section.getBoundingClientRect().top - threshold <= 0) {
          current = section.dataset.formSection;
        } else {
          break;
        }
      }
      if (current) setActiveKey(current);
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(updateActive);
    };
    const onScrollEnd = () => {
      clickTargetRef.current = null;
    };

    rafId = requestAnimationFrame(updateActive);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    scroller.addEventListener("scrollend", onScrollEnd, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("scrollend", onScrollEnd);
    };
  }, [scrollerRef, sectionKeys, visibleSections]);

  const handleSelect = (key: string) => {
    setActiveKey(key);
    scrollToSection(key);
  };

  if (tabs.length === 0) return null;

  return (
    <div className="shrink-0 border-b bg-primary-foreground px-2 py-1">
      <SidebarNav
        items={tabs}
        defaultItem={tabs[0]?.key}
        activeKey={activeKey}
        onSelect={handleSelect}
      />
    </div>
  );
}
