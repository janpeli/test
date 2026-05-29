/**
 * Pure reference-resolution algorithm — no app/store imports, so it is unit
 * testable in isolation. The store-bound wrapper lives in
 * `resolve-references.ts`.
 *
 * Resolves cross-file references embedded in an object's data into plain data
 * for a product template:
 *   - `{ $reference: "<file id>" }`  → the referenced object's (resolved) data
 *   - `{ $sub_reference: [..] }`     → its stored array of picked values
 *
 * Resolution follows direct references only (configurable depth, default 1) and
 * guards against cycles and missing files.
 */

/** Loads an object's data by file id. Returns `{}` for a missing/empty file. */
export type LoadData = (id: string) => Promise<Record<string, unknown>>;

export interface ResolveOptions {
  /** Maximum levels of `$reference` indirection to follow. Default 1. */
  depth?: number;
  /** Called when a `$reference` resolves to no data (missing/empty file). */
  onUnresolved?: (id: string) => void;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function resolveValue(
  value: unknown,
  depth: number,
  seen: Set<string>,
  load: LoadData,
  onUnresolved?: (id: string) => void
): Promise<unknown> {
  if (Array.isArray(value)) {
    return Promise.all(
      value.map((item) => resolveValue(item, depth, seen, load, onUnresolved))
    );
  }
  if (!isPlainObject(value)) return value;

  // Sub-reference: the picked values are already stored inline as the resolved
  // array — no file I/O needed.
  if ("$sub_reference" in value) {
    return value.$sub_reference ?? [];
  }

  // Reference: swap the node for the referenced object's resolved data.
  if ("$reference" in value) {
    const id = value.$reference;
    if (typeof id !== "string" || id.length === 0) return value;
    // Beyond the configured depth, or on a cycle, leave the raw node in place
    // so a template can still fall back to the reference id.
    if (depth <= 0 || seen.has(id)) return value;

    const data = await load(id);
    if (Object.keys(data).length === 0) {
      onUnresolved?.(id);
    }
    const nextSeen = new Set(seen).add(id);
    return resolveValue(data, depth - 1, nextSeen, load, onUnresolved);
  }

  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    out[key] = await resolveValue(child, depth, seen, load, onUnresolved);
  }
  return out;
}

/**
 * Resolves `$reference` / `$sub_reference` nodes in `data` using the supplied
 * `load` function to fetch referenced objects' data.
 */
export async function resolveReferences(
  data: object,
  load: LoadData,
  options: ResolveOptions = {}
): Promise<object> {
  const depth = options.depth ?? 1;
  const resolved = await resolveValue(
    data,
    depth,
    new Set<string>(),
    load,
    options.onUnresolved
  );
  return isPlainObject(resolved) ? resolved : {};
}
