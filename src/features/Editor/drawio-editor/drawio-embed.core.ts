/**
 * Pure helpers for the DRAWIO editor mode (no app/store/Electron imports so
 * they are unit-testable — see drawio-embed.core.test.ts).
 *
 * The drawio webapp is vendored at data/drawio-webapp and served over the
 * drawio:// protocol (electron/main.ts). The iframe runs drawio's embed mode:
 * with `embed=1&proto=json` the editor exchanges JSON-encoded postMessage
 * strings with its parent — it sends `{event:"init"}` when ready, expects a
 * `{action:"load", xml}` back, and reports edits via `{event:"autosave", xml}`
 * / `{event:"save", xml}`. See https://www.drawio.com/docs/reference/embed-mode
 */

/** Minimal valid drawio document, used for new/empty files. */
export const DRAWIO_EMPTY_DIAGRAM = `<mxfile host="app">
  <diagram id="diagram-1" name="Page-1">
    <mxGraphModel dx="800" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`;

export function buildDrawioUrl(options: { dark: boolean }): string {
  const params = new URLSearchParams({
    embed: "1",
    proto: "json",
    spin: "1",
    offline: "1",
    // Disables drawio's whole service-worker path (Editor.enableServiceWorker
    // gates on pwa!="0") — SW registration is unsupported on the drawio://
    // origin and would log a SecurityError at boot.
    pwa: "0",
    configure: "0",
    noSaveBtn: "1",
    noExitBtn: "1",
    ui: options.dark ? "dark" : "kennedy",
  });
  return `drawio://webapp/index.html?${params.toString()}`;
}

export interface DrawioEmbedMessage {
  event: string;
  xml?: string;
}

/**
 * Parses a raw postMessage payload from the drawio iframe. Returns null for
 * anything that isn't a JSON-encoded embed event (foreign messages, plain
 * objects from other windows, malformed JSON).
 */
export function parseEmbedMessage(raw: unknown): DrawioEmbedMessage | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const msg = parsed as Record<string, unknown>;
  if (typeof msg.event !== "string") return null;
  return {
    event: msg.event,
    xml: typeof msg.xml === "string" ? msg.xml : undefined,
  };
}

/** Serialized `load` action handing the diagram XML to the editor. */
export function makeLoadAction(xml: string): string {
  return JSON.stringify({ action: "load", xml, autosave: 1 });
}

export interface EchoGuard {
  /** Record XML we are about to post into the iframe. */
  notePush(xml: string): void;
  /** Record XML accepted from the iframe into the store. */
  noteReceive(xml: string): void;
  /**
   * Should a store-content change be pushed into the iframe? False when the
   * iframe already holds exactly this XML (the echo of an `autosave`/`save`
   * we just wrote to the store).
   */
  shouldPushToIframe(content: string): boolean;
  /**
   * Should XML arriving from the iframe be written to the store? False when
   * it is drawio's autosave echo of the `load` we just pushed.
   */
  shouldWriteToStore(xml: string): boolean;
}

/**
 * Suppresses the two feedback loops of the live SOURCE↔DRAWIO sync:
 * iframe edit → store write → content selector fires → must not reload the
 * iframe; store push → iframe may re-emit the same XML → must not rewrite the
 * store. Mirrors the loop-safety approach of the SOURCE↔FORM sync
 * (see CLAUDE.md "Live SOURCE↔FORM Sync").
 *
 * The guard tracks ONE value: the XML the iframe currently holds (the last
 * `load` pushed in, or the last `autosave`/`save` accepted out — whichever is
 * newer). Both suppression checks compare against it. Two independent sticky
 * "last pushed"/"last received" values would permanently block re-syncing any
 * previously seen state — e.g. Monaco undo back to the last autosaved XML, or
 * drawio undo back to a previously loaded XML, would silently desync the panes.
 */
export function createEchoGuard(): EchoGuard {
  let iframeXml: string | null = null;
  return {
    notePush(xml) {
      iframeXml = xml;
    },
    noteReceive(xml) {
      iframeXml = xml;
    },
    shouldPushToIframe(content) {
      return content !== iframeXml;
    },
    shouldWriteToStore(xml) {
      return xml !== iframeXml;
    },
  };
}

/**
 * LRU order for the live-iframe pool: each open drawio file keeps its own
 * always-mounted iframe (the embed protocol cannot export/restore viewport or
 * undo state, so keeping the instance alive is the only way to preserve them),
 * capped because each drawio instance is heavyweight. Returns the new
 * most-recent-first order, evicting beyond `limit`.
 */
export function activateInPool(
  pool: readonly string[],
  id: string,
  limit: number
): string[] {
  const next = [id, ...pool.filter((entry) => entry !== id)];
  return next.slice(0, Math.max(1, limit));
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * True when two non-empty rects overlap. Used by use-overlay-cover.ts to
 * decide whether an open menu/dialog covers the drawio pane: the drawio
 * iframe is a cross-origin (out-of-process) frame with its own compositor
 * surface, which Electron can paint above host-page overlays regardless of
 * z-index — so overlapping frames must be visibility-hidden instead.
 */
export function rectsIntersect(a: Rect, b: Rect): boolean {
  if (a.right <= a.left || a.bottom <= a.top) return false;
  if (b.right <= b.left || b.bottom <= b.top) return false;
  return (
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  );
}

/**
 * Overlay "holes" to punch out of the drawio iframe: instead of hiding the
 * whole frame while a menu overlaps it, the pane clips away only the region
 * under each open overlay so the menu shows through and the rest of the
 * diagram stays visible (see use-overlay-cover.ts for why overlays can never
 * paint on top of the frame directly).
 *
 * Takes viewport-coordinate rects, returns host-relative rects: expanded by
 * `margin` (so the overlay's shadow/border isn't clipped by a hard diagram
 * edge), clamped to the host, and merged so no two holes overlap or touch —
 * an evenodd polygon would re-fill the intersection of two overlapping holes
 * (e.g. a menu and its submenu), leaving a stripe of diagram over the menu.
 */
export function computeOverlayHoles(
  host: Rect,
  overlays: readonly Rect[],
  margin: number
): Rect[] {
  const width = host.right - host.left;
  const height = host.bottom - host.top;
  let holes: Rect[] = [];
  for (const overlay of overlays) {
    if (!rectsIntersect(overlay, host)) continue;
    const hole: Rect = {
      left: Math.max(0, overlay.left - margin - host.left),
      top: Math.max(0, overlay.top - margin - host.top),
      right: Math.min(width, overlay.right + margin - host.left),
      bottom: Math.min(height, overlay.bottom + margin - host.top),
    };
    if (hole.right <= hole.left || hole.bottom <= hole.top) continue;
    holes.push(hole);
  }
  // Merge until no pair overlaps or touches (bounding-box union). Quadratic,
  // but overlay counts are tiny (a menu chain is 2–3 rects).
  let merged = true;
  while (merged) {
    merged = false;
    const next: Rect[] = [];
    for (const hole of holes) {
      const hit = next.findIndex(
        (other) =>
          hole.left <= other.right &&
          hole.right >= other.left &&
          hole.top <= other.bottom &&
          hole.bottom >= other.top
      );
      if (hit === -1) {
        next.push(hole);
      } else {
        const other = next[hit];
        next[hit] = {
          left: Math.min(hole.left, other.left),
          top: Math.min(hole.top, other.top),
          right: Math.max(hole.right, other.right),
          bottom: Math.max(hole.bottom, other.bottom),
        };
        merged = true;
      }
    }
    holes = next;
  }
  return holes;
}

/**
 * Builds the CSS clip-path that keeps the whole element visible except the
 * given (host-relative, non-overlapping) holes: an evenodd polygon whose
 * outer ring is the full element and each hole is an inner ring. Returns null
 * when there is nothing to punch out (no clip needed).
 */
export function holesToClipPath(holes: readonly Rect[]): string | null {
  if (holes.length === 0) return null;
  const px = (n: number) => `${Math.round(n)}px`;
  const rings = holes.map(
    (h) =>
      `${px(h.left)} ${px(h.top)},${px(h.right)} ${px(h.top)},` +
      `${px(h.right)} ${px(h.bottom)},${px(h.left)} ${px(h.bottom)},` +
      `${px(h.left)} ${px(h.top)}`
  );
  return `polygon(evenodd,0 0,100% 0,100% 100%,0 100%,0 0,${rings.join(",")})`;
}

/** True when the text parses as XML — used to skip pushing half-typed SOURCE
 * edits into the iframe (same "ignore until it parses" philosophy as the
 * YAML SOURCE→FORM sync). Callers supply a DOMParser-compatible parser so the
 * check stays testable outside the browser. */
export function isParsableXml(
  text: string,
  parse: (text: string) => { hasError: boolean }
): boolean {
  if (text.trim().length === 0) return false;
  return !parse(text).hasError;
}
