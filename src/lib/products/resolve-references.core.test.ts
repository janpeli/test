import { describe, expect, it, vi } from "vitest";
import { resolveReferences, LoadData } from "./resolve-references.core";

describe("resolveReferences", () => {
  it("passes plain data through unchanged", async () => {
    const load: LoadData = vi.fn();
    const data = { general: { name: "Customer" }, columns: [{ name: "id" }] };
    const result = await resolveReferences(data, load);
    expect(result).toEqual(data);
    expect(load).not.toHaveBeenCalled();
  });

  it("resolves a $reference node to the referenced object's data", async () => {
    const load: LoadData = vi.fn(async (id) =>
      id === "tables/Customer.tbl.yaml" ? { general: { name: "Customer" } } : {}
    );
    const data = { referenced_table: { $reference: "tables/Customer.tbl.yaml" } };
    const result = await resolveReferences(data, load);
    expect(result).toEqual({ referenced_table: { general: { name: "Customer" } } });
    expect(load).toHaveBeenCalledWith("tables/Customer.tbl.yaml");
  });

  it("resolves $sub_reference to its stored array without any file I/O", async () => {
    const load: LoadData = vi.fn();
    const data = { picked: { $sub_reference: [{ id: "a" }, { id: "b" }] } };
    const result = await resolveReferences(data, load);
    expect(result).toEqual({ picked: [{ id: "a" }, { id: "b" }] });
    expect(load).not.toHaveBeenCalled();
  });

  it("defaults $sub_reference to an empty array when its value is absent", async () => {
    const load: LoadData = vi.fn();
    const data = { picked: { $sub_reference: undefined } };
    const result = await resolveReferences(data, load);
    expect(result).toEqual({ picked: [] });
  });

  it("recurses into arrays of objects", async () => {
    const load: LoadData = vi.fn(async () => ({ name: "Resolved" }));
    const data = { items: [{ ref: { $reference: "a" } }, { ref: { $reference: "b" } }] };
    const result = await resolveReferences(data, load);
    expect(result).toEqual({
      items: [{ ref: { name: "Resolved" } }, { ref: { name: "Resolved" } }],
    });
  });

  it("leaves the raw node in place when the reference id is missing/empty", async () => {
    const load: LoadData = vi.fn();
    const data = { a: { $reference: "" }, b: { $reference: 42 } };
    const result = await resolveReferences(data, load);
    expect(result).toEqual(data);
    expect(load).not.toHaveBeenCalled();
  });

  it("calls onUnresolved and resolves to {} when the referenced file is missing/empty", async () => {
    const load: LoadData = vi.fn(async () => ({}));
    const onUnresolved = vi.fn();
    const data = { referenced_table: { $reference: "missing.tbl.yaml" } };
    const result = await resolveReferences(data, load, { onUnresolved });
    expect(result).toEqual({ referenced_table: {} });
    expect(onUnresolved).toHaveBeenCalledWith("missing.tbl.yaml");
  });

  it("does not follow references beyond the configured depth (default 1)", async () => {
    // a -> b -> c ; b's own data still contains a raw $reference to c.
    const load: LoadData = vi.fn(async (id) => {
      if (id === "a") return { $reference: "b" };
      if (id === "b") return { next: { $reference: "c" } };
      return {};
    });
    const data = { top: { $reference: "a" } };
    const result = await resolveReferences(data, load);
    // depth 1: "a" resolves to its data, but the nested "$reference: b" inside
    // that data is one level deeper than the configured depth, so it is left raw.
    expect(result).toEqual({ top: { $reference: "b" } });
  });

  it("follows references deeper when depth is increased, but stops on a cycle", async () => {
    const load: LoadData = vi.fn(async (id) => {
      if (id === "a") return { $reference: "b" };
      if (id === "b") return { $reference: "a" }; // cycle back to a
      return {};
    });
    const data = { top: { $reference: "a" } };
    const result = await resolveReferences(data, load, { depth: 5 });
    // a -> b -> (a already seen) -> raw node left in place.
    expect(result).toEqual({ top: { $reference: "a" } });
  });

  it("returns {} for a top-level value that is not a plain object after resolution", async () => {
    const load: LoadData = vi.fn();
    // A bare $sub_reference at the top level resolves to an array, not an object.
    const result = await resolveReferences({ $sub_reference: [1, 2] }, load);
    expect(result).toEqual({});
  });
});
