/**
 * Pure comment-preserving YAML round-trip — no app/store imports, so it is unit
 * testable in isolation (esbuild + Node, or Vitest).
 *
 * The app normally saves edited form data with `yaml.stringify(formData)`, which
 * discards every comment, key-order quirk and anchor in the user's file. This
 * module instead applies `formData` as a *patch* onto the parsed source
 * document, mutating only what actually changed so surrounding comments survive.
 *
 * Invariant (comments are best-effort *on top* of this): for every non-null
 * return, `yaml.parse(result)` deep-equals `formData`. Callers fall back to
 * `yaml.stringify` when this returns null.
 *
 * ── Node-preservation approach (verified against yaml 2.9.0) ──────────────────
 * We use `doc.setIn(path, scalar)` for scalar edits rather than fetching the
 * node with `getIn(path, true)` and mutating `.value` by hand. `setIn` already
 * preserves the node: `YAMLMap.add`/`YAMLSeq.set` special-case an existing
 * scalar whose replacement is also a scalar value —
 *   `if (isScalar(prev) && isScalarValue(value)) prev.value = value`
 * ("keep the old node & its comments and anchors"). This mutates the existing
 * Scalar in place, so `comment`/`commentBefore`/anchor are retained AND the
 * serialized source is refreshed to the new value (e.g. `age: 30 # c` becomes
 * `age: 31 # c`; `key: "a" # c` becomes `key: "b" # c` — no stale source). We
 * still skip `setIn` entirely for *unchanged* scalars, both to avoid needless
 * churn and as belt-and-braces against any reformatting.
 *
 * Collections are patched member-by-member (per map key, per array index) rather
 * than replaced wholesale, because replacing a collection node discards every
 * comment nested inside it. Whole-node `setIn` is used only when a path is new
 * or its type changes (scalar↔map↔seq), where there is no old comment to keep.
 *
 * ── Known comment losses (inherent to yaml 2.9.0, not this patch) ─────────────
 *  - An inline comment on a *collection-valued* key (`general: # x`) is
 *    relocated by the library to its own line above the first child on any
 *    re-stringify. The text survives; only its position moves. Inline comments
 *    on scalar-valued keys stay put.
 *  - A collection whose value is replaced wholesale (type change, or a whole
 *    array item swapped out) loses the comments nested inside the old node.
 *  - Array items are matched by index only: reordering carries a stale comment
 *    onto whatever now sits at that index (accepted per-item loss, YAGNI).
 */

import { isMap, isScalar, isSeq, parseDocument } from "yaml";
import type { Document } from "yaml";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The collection node at `path`, or `doc.contents` for the empty (root) path. */
function nodeAt(doc: Document, path: (string | number)[]): unknown {
  return path.length === 0 ? doc.contents : doc.getIn(path, true);
}

/** The JS value of a map Pair's key (usually a string in this app's models). */
function keyOf(item: unknown): unknown {
  const key = (item as { key?: unknown }).key;
  return isScalar(key) ? key.value : key;
}

/**
 * Patches a single value at `path` into the document, choosing the narrowest
 * mutation that preserves comments.
 */
function patchValue(
  doc: Document,
  path: (string | number)[],
  value: unknown
): void {
  // `undefined` mirrors `yaml.stringify`, which omits undefined map keys.
  if (value === undefined) {
    if (doc.hasIn(path)) doc.deleteIn(path);
    return;
  }

  if (isPlainObject(value)) {
    const node = nodeAt(doc, path);
    if (isMap(node)) patchMap(doc, path, node, value);
    // New key or scalar/seq → map type change: whole new node, default format.
    else doc.setIn(path, value);
    return;
  }

  if (Array.isArray(value)) {
    const node = nodeAt(doc, path);
    if (isSeq(node)) patchSeq(doc, path, node, value);
    else doc.setIn(path, value);
    return;
  }

  // Scalar (string | number | boolean | null).
  const node = nodeAt(doc, path);
  if (node !== undefined && !isScalar(node)) {
    // Existing collection replaced by a scalar → type change, no comment to keep.
    doc.setIn(path, value);
    return;
  }
  const exists = doc.hasIn(path);
  const current = exists ? doc.getIn(path) : undefined; // scalar unwrapped
  // Only write when new or genuinely changed; unchanged nodes are left intact.
  if (!exists || current !== value) doc.setIn(path, value);
}

/** Recurses into a map, patching per key so untouched keys keep their comments. */
function patchMap(
  doc: Document,
  path: (string | number)[],
  mapNode: { items: unknown[] },
  formObj: Record<string, unknown>
): void {
  // Snapshot existing keys before mutation so appends below aren't re-scanned.
  const docKeys = mapNode.items.map(keyOf);
  const formKeys = Object.keys(formObj);

  for (const key of formKeys) patchValue(doc, [...path, key], formObj[key]);

  // Delete keys the form dropped — an `undefined` form value counts as dropped
  // (again matching `yaml.stringify`, which omits it).
  const kept = new Set(formKeys.filter((k) => formObj[k] !== undefined));
  for (const key of docKeys) {
    if (!kept.has(key as string)) doc.deleteIn([...path, key as string | number]);
  }
}

/**
 * Patches a sequence index-by-index so editing one item preserves comments on
 * its siblings. Reordered items carry the wrong comment — accepted per-item
 * loss (no identity matching, per YAGNI).
 */
function patchSeq(
  doc: Document,
  path: (string | number)[],
  seqNode: { items: unknown[] },
  formArr: unknown[]
): void {
  const docLen = seqNode.items.length;
  const formLen = formArr.length;
  const common = Math.min(docLen, formLen);

  // `undefined` array holes round-trip through `yaml.stringify` as `null`;
  // normalise so a hole never triggers `patchValue`'s delete-on-undefined path.
  const at = (i: number) => (formArr[i] === undefined ? null : formArr[i]);

  for (let i = 0; i < common; i++) patchValue(doc, [...path, i], at(i));

  if (formLen > docLen) {
    // Append: `setIn` at index === length pushes a fresh item.
    for (let i = docLen; i < formLen; i++) doc.setIn([...path, i], at(i));
  } else if (docLen > formLen) {
    // Delete trailing extras back-to-front so earlier indices stay valid.
    for (let i = docLen - 1; i >= formLen; i--) doc.deleteIn([...path, i]);
  }
}

/**
 * Applies `formData` onto `sourceText` as a comment-preserving patch.
 *
 * @returns the patched YAML text, or `null` when the source cannot be parsed
 *   cleanly (parse errors, empty/non-map document) or `formData` is not a plain
 *   object — in which case the caller should fall back to `yaml.stringify`.
 */
export function applyFormToYaml(
  sourceText: string,
  formData: unknown
): string | null {
  if (!isPlainObject(formData)) return null;

  // parseDocument is the only yaml entry point that exposes the node tree;
  // it collects syntax problems in `doc.errors` rather than throwing.
  const doc = parseDocument(sourceText);
  if (doc.errors.length > 0) return null;
  // A blank source parses without errors but has no map to patch onto; bail so
  // the caller stringifies from scratch.
  if (!isMap(doc.contents)) return null;

  patchMap(doc, [], doc.contents as unknown as { items: unknown[] }, formData);
  return doc.toString();
}
