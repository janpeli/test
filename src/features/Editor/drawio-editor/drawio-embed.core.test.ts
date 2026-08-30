import { describe, it, expect } from "vitest";
import {
  DRAWIO_EMPTY_DIAGRAM,
  activateInPool,
  buildDrawioUrl,
  computeOverlayHoles,
  createEchoGuard,
  holesToClipPath,
  isParsableXml,
  makeLoadAction,
  parseEmbedMessage,
  rectsIntersect,
} from "./drawio-embed.core";

describe("buildDrawioUrl", () => {
  it("targets the drawio:// webapp in embed mode with JSON protocol", () => {
    const url = buildDrawioUrl({ dark: false });
    expect(url.startsWith("drawio://webapp/index.html?")).toBe(true);
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("embed")).toBe("1");
    expect(params.get("proto")).toBe("json");
    expect(params.get("offline")).toBe("1");
    expect(params.get("pwa")).toBe("0");
    expect(params.get("ui")).toBe("kennedy");
  });

  it("switches ui for dark mode", () => {
    expect(buildDrawioUrl({ dark: true })).toContain("ui=dark");
  });
});

describe("parseEmbedMessage", () => {
  it("parses embed events", () => {
    expect(parseEmbedMessage(JSON.stringify({ event: "init" }))).toEqual({
      event: "init",
      xml: undefined,
    });
    expect(
      parseEmbedMessage(JSON.stringify({ event: "autosave", xml: "<mxfile/>" }))
    ).toEqual({ event: "autosave", xml: "<mxfile/>" });
  });

  it("rejects foreign or malformed payloads", () => {
    expect(parseEmbedMessage(undefined)).toBeNull();
    expect(parseEmbedMessage({ event: "init" })).toBeNull(); // objects, not JSON strings
    expect(parseEmbedMessage("not json")).toBeNull();
    expect(parseEmbedMessage('"just a string"')).toBeNull();
    expect(parseEmbedMessage(JSON.stringify({ xml: "<a/>" }))).toBeNull();
  });
});

describe("makeLoadAction", () => {
  it("round-trips through JSON with autosave enabled", () => {
    const msg = JSON.parse(makeLoadAction("<mxfile/>"));
    expect(msg).toEqual({ action: "load", xml: "<mxfile/>", autosave: 1 });
  });
});

describe("createEchoGuard", () => {
  it("suppresses the iframe→store→selector echo", () => {
    const guard = createEchoGuard();
    // drawio autosaves; we accept it into the store.
    expect(guard.shouldWriteToStore("<v1/>")).toBe(true);
    guard.noteReceive("<v1/>");
    // The store update re-fires the content selector with the same XML.
    expect(guard.shouldPushToIframe("<v1/>")).toBe(false);
  });

  it("suppresses the store→iframe→autosave echo", () => {
    const guard = createEchoGuard();
    // A Monaco edit lands in the store; we push it to the iframe.
    expect(guard.shouldPushToIframe("<v2/>")).toBe(true);
    guard.notePush("<v2/>");
    // drawio re-emits the same XML as an autosave after the load.
    expect(guard.shouldWriteToStore("<v2/>")).toBe(false);
  });

  it("lets genuinely new content through in both directions", () => {
    const guard = createEchoGuard();
    guard.notePush("<v1/>");
    guard.noteReceive("<v2/>");
    expect(guard.shouldPushToIframe("<v3/>")).toBe(true);
    expect(guard.shouldWriteToStore("<v3/>")).toBe(true);
  });

  it("pushes a Monaco undo back to a previously autosaved state", () => {
    const guard = createEchoGuard();
    // drawio autosaves X; accepted into the store.
    guard.noteReceive("<x/>");
    // Monaco edit W is pushed into the iframe.
    expect(guard.shouldPushToIframe("<w/>")).toBe(true);
    guard.notePush("<w/>");
    // Monaco undo restores X — the iframe holds W, so X must be pushed
    // even though it equals an earlier received value.
    expect(guard.shouldPushToIframe("<x/>")).toBe(true);
  });

  it("accepts a drawio undo back to a previously loaded state", () => {
    const guard = createEchoGuard();
    // Initial load P.
    guard.notePush("<p/>");
    // drawio edit Q autosaved and accepted.
    expect(guard.shouldWriteToStore("<q/>")).toBe(true);
    guard.noteReceive("<q/>");
    // drawio undo re-emits P — the store holds Q, so P must be written
    // even though it equals an earlier pushed value.
    expect(guard.shouldWriteToStore("<p/>")).toBe(true);
  });
});

describe("activateInPool", () => {
  it("moves the activated id to the front", () => {
    expect(activateInPool(["a", "b", "c"], "c", 4)).toEqual(["c", "a", "b"]);
  });

  it("adds new ids and evicts beyond the limit", () => {
    expect(activateInPool(["a", "b", "c"], "d", 3)).toEqual(["d", "a", "b"]);
  });

  it("keeps at least the activated id even with a degenerate limit", () => {
    expect(activateInPool(["a"], "b", 0)).toEqual(["b"]);
  });
});

describe("rectsIntersect", () => {
  const rect = (left: number, top: number, right: number, bottom: number) => ({
    left,
    top,
    right,
    bottom,
  });

  it("detects overlap and separation", () => {
    expect(rectsIntersect(rect(0, 0, 10, 10), rect(5, 5, 15, 15))).toBe(true);
    expect(rectsIntersect(rect(0, 0, 10, 10), rect(10, 0, 20, 10))).toBe(false); // touching edges
    expect(rectsIntersect(rect(0, 0, 10, 10), rect(20, 20, 30, 30))).toBe(false);
  });

  it("treats empty rects as non-intersecting", () => {
    expect(rectsIntersect(rect(5, 5, 5, 5), rect(0, 0, 10, 10))).toBe(false);
    expect(rectsIntersect(rect(0, 0, 10, 10), rect(5, 5, 5, 5))).toBe(false);
  });
});

describe("computeOverlayHoles", () => {
  const rect = (left: number, top: number, right: number, bottom: number) => ({
    left,
    top,
    right,
    bottom,
  });
  const host = rect(100, 50, 500, 450); // 400×400 pane at (100,50)

  it("converts to host-relative coordinates with margin", () => {
    expect(computeOverlayHoles(host, [rect(200, 100, 300, 200)], 4)).toEqual([
      rect(96, 46, 204, 154),
    ]);
  });

  it("clamps holes to the host bounds", () => {
    // Overlay hangs off the pane's top-left corner.
    expect(computeOverlayHoles(host, [rect(50, 0, 150, 100)], 0)).toEqual([
      rect(0, 0, 50, 50),
    ]);
  });

  it("drops overlays that do not intersect the host", () => {
    expect(computeOverlayHoles(host, [rect(600, 500, 700, 600)], 4)).toEqual(
      []
    );
  });

  it("merges overlapping holes (menu + submenu) into one", () => {
    // An evenodd polygon would re-fill the intersection of two overlapping
    // inner rings, so overlapping holes must arrive merged.
    const holes = computeOverlayHoles(
      host,
      [rect(150, 100, 250, 300), rect(240, 150, 350, 250)],
      0
    );
    expect(holes).toEqual([rect(50, 50, 250, 250)]);
  });

  it("keeps disjoint holes separate", () => {
    const holes = computeOverlayHoles(
      host,
      [rect(150, 100, 200, 150), rect(300, 300, 350, 350)],
      0
    );
    expect(holes).toHaveLength(2);
  });
});

describe("holesToClipPath", () => {
  it("returns null when there is nothing to punch out", () => {
    expect(holesToClipPath([])).toBeNull();
  });

  it("builds an evenodd polygon with the full-element outer ring", () => {
    const path = holesToClipPath([
      { left: 10, top: 20, right: 110, bottom: 220 },
    ]);
    expect(path).toBe(
      "polygon(evenodd,0 0,100% 0,100% 100%,0 100%,0 0," +
        "10px 20px,110px 20px,110px 220px,10px 220px,10px 20px)"
    );
  });

  it("emits one inner ring per hole", () => {
    const path = holesToClipPath([
      { left: 0, top: 0, right: 10, bottom: 10 },
      { left: 20, top: 20, right: 30, bottom: 30 },
    ]);
    expect(path).toContain("10px 10px");
    expect(path).toContain("20px 20px");
  });
});

describe("isParsableXml", () => {
  const fakeParser = (text: string) => ({ hasError: text.includes("BAD") });
  it("rejects empty and error-producing text", () => {
    expect(isParsableXml("", fakeParser)).toBe(false);
    expect(isParsableXml("  \n", fakeParser)).toBe(false);
    expect(isParsableXml("<BAD", fakeParser)).toBe(false);
  });
  it("accepts parsable text", () => {
    expect(isParsableXml("<mxfile/>", fakeParser)).toBe(true);
  });
});

describe("DRAWIO_EMPTY_DIAGRAM", () => {
  it("contains the required mxfile skeleton", () => {
    expect(DRAWIO_EMPTY_DIAGRAM).toContain("<mxfile");
    expect(DRAWIO_EMPTY_DIAGRAM).toContain("<mxGraphModel");
    expect(DRAWIO_EMPTY_DIAGRAM).toContain('<mxCell id="0"');
  });
});
