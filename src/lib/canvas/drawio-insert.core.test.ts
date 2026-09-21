import { describe, it, expect } from "vitest";
import { mergeCellsIntoDiagram } from "./drawio-insert.core";

const DIAGRAM = `<mxfile host="app">
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

describe("mergeCellsIntoDiagram", () => {
  it("inserts a fragment cell before </root> with a fresh id", () => {
    const fragment = `<mxCell id="table" value="Employees" style="shape=table" vertex="1" parent="1"><mxGeometry x="40" y="40" width="160" height="120" as="geometry" /></mxCell>`;
    const result = mergeCellsIntoDiagram(DIAGRAM, fragment, { idSeed: "obj-1" });
    if ("error" in result) throw new Error(result.error);
    expect(result.xml).toContain('id="obj-1-0"');
    expect(result.xml).not.toContain('id="table"');
    // Existing content stays byte-identical outside the insertion.
    expect(result.xml.indexOf('<mxCell id="0"')).toBeGreaterThan(-1);
    expect(result.xml.indexOf('id="obj-1-0"')).toBeLessThan(
      result.xml.indexOf("</root>")
    );
  });

  it("keeps parent references outside the fragment unchanged", () => {
    const fragment = `<mxCell id="table" value="Employees" style="shape=table" vertex="1" parent="1"><mxGeometry x="40" y="40" width="160" height="120" as="geometry" /></mxCell>`;
    const result = mergeCellsIntoDiagram(DIAGRAM, fragment, { idSeed: "obj-1" });
    if ("error" in result) throw new Error(result.error);
    expect(result.xml).toContain('parent="1"');
  });

  it("rewires parent/source/target references within the same fragment", () => {
    const fragment = [
      `<mxCell id="a" value="A" vertex="1" parent="1"><mxGeometry x="0" y="0" width="80" height="40" as="geometry" /></mxCell>`,
      `<mxCell id="b" value="B" vertex="1" parent="1"><mxGeometry x="200" y="0" width="80" height="40" as="geometry" /></mxCell>`,
      `<mxCell id="e1" edge="1" parent="1" source="a" target="b" />`,
    ].join("\n");
    const result = mergeCellsIntoDiagram(DIAGRAM, fragment, { idSeed: "obj-2" });
    if ("error" in result) throw new Error(result.error);
    const idA = result.xml.match(/id="(obj-2-0)"/)?.[1];
    const idB = result.xml.match(/id="(obj-2-1)"/)?.[1];
    expect(idA).toBe("obj-2-0");
    expect(idB).toBe("obj-2-1");
    expect(result.xml).toContain(`source="obj-2-0"`);
    expect(result.xml).toContain(`target="obj-2-1"`);
  });

  it("assigns distinct ids across repeated calls into the same diagram", () => {
    const fragment = `<mxCell id="table" vertex="1" parent="1"><mxGeometry x="0" y="0" width="80" height="40" as="geometry" /></mxCell>`;
    const first = mergeCellsIntoDiagram(DIAGRAM, fragment, { idSeed: "obj-1" });
    if ("error" in first) throw new Error(first.error);
    const second = mergeCellsIntoDiagram(first.xml, fragment, { idSeed: "obj-1" });
    if ("error" in second) throw new Error(second.error);
    expect(second.xml).toContain('id="obj-1-0"');
    expect(second.xml).toContain('id="obj-1-1"');
  });

  it("cascades the geometry offset for repeated vertex drops", () => {
    const fragment = `<mxCell id="table" vertex="1" parent="1"><mxGeometry x="40" y="40" width="80" height="40" as="geometry" /></mxCell>`;
    const first = mergeCellsIntoDiagram(DIAGRAM, fragment, { idSeed: "obj-1" });
    if ("error" in first) throw new Error(first.error);
    // No existing vertex cells yet, so the first drop is unshifted.
    expect(first.xml).toContain('x="40"');

    const second = mergeCellsIntoDiagram(first.xml, fragment, { idSeed: "obj-1" });
    if ("error" in second) throw new Error(second.error);
    // One existing vertex now present -> offset by one OFFSET_STEP (20px).
    expect(second.xml).toContain('x="60"');
    expect(second.xml).toContain('y="60"');
  });

  it("keeps nested cell geometry relative to its container, unaffected by the cascade", () => {
    // table -> row -> cell, drawio's real ER-table shape: a table's row/cell
    // geometry is relative to its own parent, not the diagram, so it must
    // never be shifted by the top-level placement cascade.
    const fragment = [
      `<mxCell id="tbl" value="Employees" style="shape=table" vertex="1" parent="1"><mxGeometry x="40" y="40" width="160" height="60" as="geometry" /></mxCell>`,
      `<mxCell id="row" style="shape=tableRow" vertex="1" parent="tbl"><mxGeometry y="30" width="160" height="30" as="geometry" /></mxCell>`,
      `<mxCell id="cell" value="id" style="shape=partialRectangle" vertex="1" parent="row"><mxGeometry width="160" height="30" as="geometry" /></mxCell>`,
    ].join("\n");

    const first = mergeCellsIntoDiagram(DIAGRAM, fragment, { idSeed: "obj-1" });
    if ("error" in first) throw new Error(first.error);
    // Only one top-level vertex (the table) exists after this — a second
    // drop must cascade the table only, never the row/cell.
    const second = mergeCellsIntoDiagram(first.xml, fragment, { idSeed: "obj-1" });
    if ("error" in second) throw new Error(second.error);

    // Table (top-level, parent="1") shifts by one OFFSET_STEP.
    expect(second.xml).toContain('x="60" y="60" width="160" height="60"');
    // Row and cell (nested) keep their original relative geometry untouched,
    // once per drop — never shifted by the cascade. Anchored right after the
    // tag name so the row's geometry (leading `y="30"`) and the cell's
    // (no `y`) can't accidentally match each other's pattern.
    const rowGeoms = second.xml.match(/<mxGeometry y="30" width="160" height="30"/g) ?? [];
    expect(rowGeoms.length).toBe(2);
    const cellGeoms = second.xml.match(/<mxGeometry width="160" height="30" as="geometry"/g) ?? [];
    expect(cellGeoms.length).toBe(2);
  });

  it("rewires a nested chain of parent references (table -> row -> cell)", () => {
    const fragment = [
      `<mxCell id="tbl" value="Employees" vertex="1" parent="1"><mxGeometry x="40" y="40" width="160" height="60" as="geometry" /></mxCell>`,
      `<mxCell id="row" vertex="1" parent="tbl"><mxGeometry y="30" width="160" height="30" as="geometry" /></mxCell>`,
      `<mxCell id="cell" value="id" vertex="1" parent="row"><mxGeometry width="160" height="30" as="geometry" /></mxCell>`,
    ].join("\n");
    const result = mergeCellsIntoDiagram(DIAGRAM, fragment, { idSeed: "obj-3" });
    if ("error" in result) throw new Error(result.error);

    expect(result.xml).toContain('id="obj-3-0"'); // tbl
    expect(result.xml).toContain('id="obj-3-1"'); // row
    expect(result.xml).toContain('id="obj-3-2"'); // cell
    expect(result.xml).toContain('parent="obj-3-0"'); // row -> tbl
    expect(result.xml).toContain('parent="obj-3-1"'); // cell -> row
  });

  it("does not count nested vertex cells toward the placement cascade", () => {
    const table = [
      `<mxCell id="tbl" vertex="1" parent="1"><mxGeometry x="40" y="40" width="160" height="90" as="geometry" /></mxCell>`,
      `<mxCell id="r1" vertex="1" parent="tbl"><mxGeometry y="30" width="160" height="30" as="geometry" /></mxCell>`,
      `<mxCell id="r2" vertex="1" parent="tbl"><mxGeometry y="60" width="160" height="30" as="geometry" /></mxCell>`,
    ].join("\n");
    const single = `<mxCell id="s" vertex="1" parent="1"><mxGeometry x="1" y="1" width="10" height="10" as="geometry" /></mxCell>`;

    const withTable = mergeCellsIntoDiagram(DIAGRAM, table, { idSeed: "obj-4" });
    if ("error" in withTable) throw new Error(withTable.error);
    // The table has 1 top-level vertex and 2 nested ones; a subsequent
    // unrelated drop must only be shifted by one OFFSET_STEP, not three.
    const next = mergeCellsIntoDiagram(withTable.xml, single, { idSeed: "obj-5" });
    if ("error" in next) throw new Error(next.error);
    expect(next.xml).toContain('x="21" y="21"');
  });

  it("handles a UserObject-wrapped cell (id on the wrapper, vertex/parent on the inner mxCell)", () => {
    const fragment = `<UserObject label="Employees" owner="hr" id="uo"><mxCell style="shape=table" vertex="1" parent="1"><mxGeometry x="40" y="40" width="160" height="120" as="geometry" /></mxCell></UserObject>`;
    const result = mergeCellsIntoDiagram(DIAGRAM, fragment, { idSeed: "obj-6" });
    if ("error" in result) throw new Error(result.error);
    // The wrapper's own id is remapped, and its custom business attributes
    // (label/owner) survive untouched.
    expect(result.xml).toContain('id="obj-6-0"');
    expect(result.xml).not.toContain('id="uo"');
    expect(result.xml).toContain('label="Employees"');
    expect(result.xml).toContain('owner="hr"');
    // The inner mxCell's structural attributes are preserved verbatim.
    expect(result.xml).toContain('vertex="1"');
    expect(result.xml).toContain('parent="1"');
  });

  it("handles a legacy <object>-wrapped cell the same way", () => {
    const fragment = `<object label="Employees" id="o1"><mxCell style="shape=table" vertex="1" parent="1"><mxGeometry x="40" y="40" width="160" height="120" as="geometry" /></mxCell></object>`;
    const result = mergeCellsIntoDiagram(DIAGRAM, fragment, { idSeed: "obj-7" });
    if ("error" in result) throw new Error(result.error);
    expect(result.xml).toContain('id="obj-7-0"');
    expect(result.xml).toContain('label="Employees"');
  });

  it("cascades a top-level UserObject-wrapped vertex like a plain mxCell", () => {
    const fragment = `<UserObject label="Employees" id="uo"><mxCell vertex="1" parent="1"><mxGeometry x="40" y="40" width="80" height="40" as="geometry" /></mxCell></UserObject>`;
    const first = mergeCellsIntoDiagram(DIAGRAM, fragment, { idSeed: "obj-8" });
    if ("error" in first) throw new Error(first.error);
    const second = mergeCellsIntoDiagram(first.xml, fragment, { idSeed: "obj-8" });
    if ("error" in second) throw new Error(second.error);
    expect(second.xml).toContain('x="60" y="60"');
  });

  it("rewires a parent chain that mixes plain mxCell and UserObject-wrapped elements", () => {
    const fragment = [
      `<mxCell id="tbl" vertex="1" parent="1"><mxGeometry x="40" y="40" width="160" height="60" as="geometry" /></mxCell>`,
      `<UserObject label="row" id="row"><mxCell vertex="1" parent="tbl"><mxGeometry y="30" width="160" height="30" as="geometry" /></mxCell></UserObject>`,
    ].join("\n");
    const result = mergeCellsIntoDiagram(DIAGRAM, fragment, { idSeed: "obj-9" });
    if ("error" in result) throw new Error(result.error);
    expect(result.xml).toContain('id="obj-9-0"'); // tbl
    expect(result.xml).toContain('id="obj-9-1"'); // row (on the UserObject)
    expect(result.xml).toContain('parent="obj-9-0"'); // row -> tbl
    // The UserObject-wrapped row is nested, so its geometry is untouched by
    // any cascade even though it's a vertex.
    expect(result.xml).toContain('y="30" width="160" height="30"');
  });

  it("supports nesting deeper than 2 levels transitively (group > subgroup > cell)", () => {
    const fragment = [
      `<mxCell id="g1" vertex="1" connectable="0" parent="1"><mxGeometry x="0" y="0" width="200" height="200" as="geometry" /></mxCell>`,
      `<mxCell id="g2" vertex="1" connectable="0" parent="g1"><mxGeometry x="10" y="10" width="180" height="180" as="geometry" /></mxCell>`,
      `<mxCell id="leaf" value="Leaf" vertex="1" parent="g2"><mxGeometry x="5" y="5" width="50" height="20" as="geometry" /></mxCell>`,
    ].join("\n");
    const result = mergeCellsIntoDiagram(DIAGRAM, fragment, { idSeed: "obj-10" });
    if ("error" in result) throw new Error(result.error);
    expect(result.xml).toContain('id="obj-10-0"'); // g1
    expect(result.xml).toContain('id="obj-10-1"'); // g2
    expect(result.xml).toContain('id="obj-10-2"'); // leaf
    expect(result.xml).toContain('parent="obj-10-0"'); // g2 -> g1
    expect(result.xml).toContain('parent="obj-10-1"'); // leaf -> g2
    // Deeply nested geometry stays untouched even on a repeat drop.
    const second = mergeCellsIntoDiagram(result.xml, fragment, { idSeed: "obj-10" });
    if ("error" in second) throw new Error(second.error);
    expect(second.xml).toContain('x="5" y="5" width="50" height="20"');
  });

  it("errors when the diagram has no <root> element", () => {
    const fragment = `<mxCell id="table" vertex="1" parent="1" />`;
    const result = mergeCellsIntoDiagram("<mxfile></mxfile>", fragment, {
      idSeed: "obj-1",
    });
    expect(result).toHaveProperty("error");
  });

  it("errors when the fragment has no <mxCell> elements", () => {
    const result = mergeCellsIntoDiagram(DIAGRAM, "not xml at all", {
      idSeed: "obj-1",
    });
    expect(result).toHaveProperty("error");
  });
});
