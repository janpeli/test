/**
 * Pure XML-splice logic for inserting a plugin-rendered drawio fragment into
 * an existing drawio diagram's `<root>`.
 *
 * A fragment is one or more sibling *root elements*, each either:
 *   - a bare `<mxCell>` (a plain shape/edge/group), or
 *   - a `<UserObject>`/`<object>` wrapper around a nested `<mxCell>` — the
 *     standard drawio form for a cell carrying custom data (its own
 *     attributes, e.g. `label`, plus arbitrary business properties). In this
 *     form `id` conventionally lives on the wrapper while `vertex`/`edge`/
 *     `parent`/`source`/`target` live on the inner `<mxCell>`.
 * Any of these may nest to arbitrary depth via `parent` references to
 * another root element in the same fragment (a table containing rows
 * containing column cells; a group containing a UserObject-wrapped node;
 * etc.) — nesting is expressed by the `parent` *attribute*, never by XML
 * containment of one root element inside another (mxGraph's actual data
 * model: `<root>` only ever holds a flat list of these blocks).
 *
 * Because `id` and the graph-structural attributes can land on different
 * tags within one block depending on which form it is, every attribute
 * lookup/rewrite below searches the *whole matched block* rather than one
 * specific opening tag — this reads and rewrites the right occurrence
 * regardless of which form the author used, without needing to special-case
 * each one.
 *
 * Deliberately string/regex-based rather than DOMParser/XMLSerializer:
 * DOMParser isn't available under the Vitest `node` environment (see
 * drawio-embed.core.ts's `isParsableXml`, which takes its parser as an
 * injected callback for the same reason), and — more importantly — a full
 * parse+reserialize of a user's existing diagram risks reformatting
 * attributes/whitespace/entities it never touched, producing a much larger
 * diff than the actual change. Splicing new text in before `</root>` leaves
 * everything else byte-identical.
 *
 * Fragments are author-controlled template output (not arbitrary user XML),
 * so the regexes assume attribute values don't contain a literal `>` (not
 * required to be escaped by the XML spec, but drawio never emits one in the
 * attributes this code touches).
 */

const ROOT_ELEMENT_RE =
  /<(mxCell|UserObject|object)\b[^>]*?(?:\/>|>[\s\S]*?<\/\1>)/g;
const ID_ATTR_RE = /\bid="([^"]*)"/g;
const GEOMETRY_RE = /<mxGeometry\b[^>]*\/?>/;

/** Pixel step applied per already-present vertex, so repeated drops of the
 * same object cascade instead of stacking exactly on top of each other
 * (there is no drop-coordinate mapping across the cross-origin iframe — see
 * PLUGIN_GUIDE.md's "Basic product for drawio" section). */
const OFFSET_STEP = 20;

export type MergeCellsResult = { xml: string } | { error: string };

function getAttr(text: string, name: string): string | undefined {
  const m = text.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m?.[1];
}

/**
 * Replaces the first occurrence of `name="..."` in `text`, wherever it
 * falls. Every call site checks the attribute already exists before calling
 * this except `offsetGeometry`'s `x`/`y` (which default to 0 when absent),
 * and that always passes a single isolated self-closing `<mxGeometry/>` tag
 * — so the "absent" fallback only ever needs to insert before that tag's
 * own closing `/>`.
 */
function setAttr(text: string, name: string, value: string): string {
  const re = new RegExp(`(\\s${name}=")[^"]*(")`);
  if (re.test(text)) return text.replace(re, `$1${value}$2`);
  return text.replace(/\/>\s*$/, ` ${name}="${value}"/>`);
}

function offsetGeometry(geom: string, offset: number): string {
  let out = geom;
  for (const axis of ["x", "y"] as const) {
    const current = getAttr(out, axis);
    const base = current !== undefined ? Number(current) : 0;
    out = setAttr(out, axis, String(base + offset));
  }
  return out;
}

/**
 * Counts vertex cells that attach directly to the diagram's default layer
 * (`parent="1"`) — i.e. top-level shapes, not cells nested inside a
 * container (a table's row/column cells are `vertex="1"` too, but nested,
 * and must not inflate the cascade below).
 */
function countTopLevelVertices(diagramXml: string): number {
  const blocks = diagramXml.match(ROOT_ELEMENT_RE) ?? [];
  let count = 0;
  for (const block of blocks) {
    if (getAttr(block, "vertex") === "1" && getAttr(block, "parent") === "1") {
      count++;
    }
  }
  return count;
}

/**
 * Inserts `fragmentXml` (one or more sibling root elements — see the module
 * doc comment for the recognized forms) into `diagramXml`'s `<root>`, giving
 * every fragment element a fresh id (unique against the diagram's existing
 * ids, stable across repeated calls) and rewiring `parent`/`source`/`target`
 * references that point at another element *within the same fragment* — a
 * reference outside the fragment (typically `parent="1"`, the default
 * layer) passes through unchanged. Only elements that attach directly to
 * the diagram's layer (not nested inside another fragment element — e.g. a
 * table's row/column cells, which must keep their geometry relative to
 * their container) are offset by a small cascade so repeated drops of the
 * same object don't render exactly on top of each other.
 */
export function mergeCellsIntoDiagram(
  diagramXml: string,
  fragmentXml: string,
  opts: { idSeed: string }
): MergeCellsResult {
  const rootClose = diagramXml.lastIndexOf("</root>");
  if (rootClose === -1) {
    return { error: "Diagram XML has no <root> element to insert into." };
  }

  const cellBlocks = fragmentXml.match(ROOT_ELEMENT_RE);
  if (!cellBlocks || cellBlocks.length === 0) {
    return {
      error: "Template produced no <mxCell>/<UserObject>/<object> elements.",
    };
  }

  const existingIds = new Set<string>();
  for (const m of diagramXml.matchAll(ID_ATTR_RE)) existingIds.add(m[1]);

  const usedIds = new Set(existingIds);
  let counter = 0;
  const nextId = () => {
    let id: string;
    do {
      id = `${opts.idSeed}-${counter++}`;
    } while (usedIds.has(id));
    usedIds.add(id);
    return id;
  };

  const idMap = new Map<string, string>();
  for (const block of cellBlocks) {
    const oldId = getAttr(block, "id");
    if (oldId !== undefined) idMap.set(oldId, nextId());
  }

  const offset = countTopLevelVertices(diagramXml) * OFFSET_STEP;

  const rewritten = cellBlocks.map((block) => {
    let out = block;

    const oldId = getAttr(block, "id");
    if (oldId !== undefined) out = setAttr(out, "id", idMap.get(oldId)!);

    const oldParent = getAttr(block, "parent");
    for (const attr of ["parent", "source", "target"] as const) {
      const value = getAttr(block, attr);
      if (value !== undefined && idMap.has(value)) {
        out = setAttr(out, attr, idMap.get(value)!);
      }
    }

    // An element nested inside another fragment element (e.g. a table's
    // row, or a row's column cells) keeps geometry relative to its
    // container — only elements attaching directly to the diagram's layer
    // are cascaded.
    const isNested = oldParent !== undefined && idMap.has(oldParent);
    const isVertex = getAttr(block, "vertex") === "1";
    if (isVertex && !isNested && offset > 0) {
      out = out.replace(GEOMETRY_RE, (geom) => offsetGeometry(geom, offset));
    }

    return out;
  });

  const insertion = rewritten.join("\n") + "\n";
  const xml =
    diagramXml.slice(0, rootClose) + insertion + diagramXml.slice(rootClose);

  return { xml };
}
