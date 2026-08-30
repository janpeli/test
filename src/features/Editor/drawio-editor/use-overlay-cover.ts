import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { computeOverlayHoles, rectsIntersect } from "./drawio-embed.core";
import type { Rect } from "./drawio-embed.core";

/**
 * The drawio:// iframe is a cross-origin, out-of-process frame: Electron
 * composites it on its own surface, which can paint ABOVE host-page DOM no
 * matter the z-index — so the app's portaled overlays (menubar/dropdown/
 * context menus, selects, dialogs) would appear "under" the diagram. z-index
 * cannot fix that, so this hook tracks the open overlays overlapping the
 * given container:
 *
 * - Menus/listboxes become `holes` — host-relative rects the caller punches
 *   out of the iframe via clip-path, so the overlay shows through while the
 *   rest of the diagram stays visible.
 * - Open dialogs set `hideAll` — their full-screen dimmed backdrop can't be
 *   represented as a hole, so the caller visibility-hides the frames for the
 *   duration (visibility keeps the frame alive and laid out — no reload, no
 *   state loss).
 *
 * Overlays are detected at the document level: Radix portals mount as direct
 * children of <body> ([data-radix-popper-content-wrapper] for poppers, with
 * role="menu"/"listbox" content inside — tooltips are deliberately ignored),
 * plus open dialogs. A childList-only observer on <body> catches portals
 * mounting/unmounting; because popper wrappers are positioned asynchronously
 * via a style transform (and dialogs animate via data-state), a second
 * observer is re-attached to just the currently open overlay elements to
 * track those attribute changes — observing attributes document-wide would
 * wake this hook on every inline-style mutation in the app (Monaco cursor,
 * decorations, pane resizes) for as long as a drawio file is open. Rects are
 * re-measured on a rAF.
 */
export interface OverlayCover {
  holes: Rect[];
  hideAll: boolean;
}

/** Breathing room around each hole so the overlay's shadow isn't clipped. */
const HOLE_MARGIN = 4;

const NO_COVER: OverlayCover = { holes: [], hideAll: false };

export function useOverlayCover(
  ref: RefObject<HTMLElement>,
  // The DRAWIO pane is always mounted (content-editor keeps every pane alive);
  // only observe the document while there are live iframes to protect.
  enabled: boolean
): OverlayCover {
  const [cover, setCover] = useState<OverlayCover>(NO_COVER);
  // Re-measuring on every mutation produces fresh-but-equal arrays; only
  // publish a state change when the geometry actually moved.
  const lastKeyRef = useRef("");

  useEffect(() => {
    if (!enabled) {
      lastKeyRef.current = "";
      setCover(NO_COVER);
      return;
    }
    let raf = 0;

    const measure = (): { cover: OverlayCover; watch: Element[] } => {
      const host = ref.current;
      if (!host) return { cover: NO_COVER, watch: [] };
      const hostRect = host.getBoundingClientRect();
      // Overlay elements whose attribute changes (popper transform, open/close
      // data-state) must trigger a re-measure while they are on screen.
      const watch: Element[] = [];

      const popperRects: Rect[] = [];
      document
        .querySelectorAll("[data-radix-popper-content-wrapper]")
        .forEach((el) => {
          // Menus and listboxes only; a hovering tooltip must not punch a
          // hole in the diagram. Skip content already animating out.
          const content = el.querySelector('[role="menu"], [role="listbox"]');
          if (!content) return;
          watch.push(el, content);
          if (content.getAttribute("data-state") === "closed") return;
          popperRects.push(el.getBoundingClientRect());
        });

      let hideAll = false;
      document.querySelectorAll('[role="dialog"]').forEach((el) => {
        watch.push(el);
        if (el.getAttribute("data-state") !== "open") return;
        if (rectsIntersect(el.getBoundingClientRect(), hostRect))
          hideAll = true;
      });

      return {
        cover: {
          holes: computeOverlayHoles(hostRect, popperRects, HOLE_MARGIN),
          hideAll,
        },
        watch,
      };
    };

    const check = () => {
      raf = 0;
      const { cover: next, watch } = measure();
      // Follow the live overlays' own attribute changes (position, state)
      // without observing attributes anywhere else in the document.
      overlayObserver.disconnect();
      for (const el of watch) {
        overlayObserver.observe(el, {
          attributes: true,
          attributeFilter: ["style", "data-state"],
        });
      }
      const key =
        (next.hideAll ? "H|" : "") +
        next.holes
          .map((h) => `${h.left},${h.top},${h.right},${h.bottom}`)
          .join(";");
      if (key !== lastKeyRef.current) {
        lastKeyRef.current = key;
        setCover(next);
      }
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };

    // Overlays portal in/out as direct children of <body>; childList alone
    // (no subtree, no attributes) keeps this observer silent during normal
    // app DOM churn (Monaco redraws, form edits, pane resizes).
    const portalObserver = new MutationObserver(schedule);
    portalObserver.observe(document.body, { childList: true });
    const overlayObserver = new MutationObserver(schedule);
    schedule();

    return () => {
      portalObserver.disconnect();
      overlayObserver.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [ref, enabled]);

  return cover;
}
