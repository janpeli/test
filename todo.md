- [x] add canvas functionality, create canvas in context menu on treeview and menubar, (make a file that contains mermaid), opened file should look similar to how mermaid.live works, canvas , source editor in monaco resize bar, file should be named *.can.md, editor menubar should be able to turn on and off source, 
- [x] implement deleting files. model (config) cant be deleted before all files belonging into it are deleted. from context menu in treeview.
- [x] after creating markdown file it should be autoopened.
- [x] after creating canvas file it should be autoopened.
- [x] moving files drag and drop in treeview. files that represent a object should only be able to be moved between folders that are in the same model. if drag and drop outside of parent model then do not move and add error to error pane.
- [x] create functionality to add products to plugins. A product is a template that belongs to a object type and applying the template to product a resulting text is generated. it should be a definition in a templating engine. in editor there should be a button or dropdown that switches monaco to view the product. you can have multiple products for a object type. e.g. the product of oracle table is a ddl query which creates the table. basic product of a object is also used for inserting data into canvas if the object is draged from treebview on to canvas.
  - [x] PHASE 1 (commit f7d2357): products[] in config.yaml, Nunjucks templates rendered in main process (CSP blocks eval in renderer), read-only PRODUCT pane + copy button, dropdown in editor menubar. Context = object's OWN data only. See PLUGIN_GUIDE.md §1a, CLAUDE.md "Products".

PHASE 2 — resolve $reference fields in product context: [DONE]
- [x] resolve $reference fields to the referenced objects' data (FK referenced_table no longer renders raw "models/ORG.tbl").
- [x] reference shapes handled: { $reference: "<file id>" } and { $sub_reference: [..] } (stored array used directly).
- [x] resolution runs in the RENDERER (product-editor.tsx), main's renderProduct stays a dumb template renderer.
- [x] added src/lib/products/resolve-references.ts: resolveProductContext(data, depth=1) + loadObjectData(id) (reuses getFileContentById, prefers editorForms[id]).
- [x] resolved shape: $reference node -> referenced object's data (templates do c.referenced_table.general.name); $sub_reference node -> its array. Documented in PLUGIN_GUIDE.md §1a.
- [x] guards cycles + missing files, caps recursion at 1 level (direct refs only).
- [x] product-editor.tsx resolves before renderProduct (debounce/race-guard kept); table.ddl.njk updated to use resolved FK name + arrays.

PHASE 2 — canvas drag-to-insert (drag object from treeview onto canvas inserts its basic product): [DONE]
- [x] basic product = products[].basic === true, now consumed by canvas insert.
- [x] drag source: node-controller.ts handleDragStart also sets dataTransfer "application/x-model-object" (single node id) for leaf nodes; internal reorder still uses "custom/treeDraggNodes" so move behaviour is unaffected.
- [x] drop target: canvas-editor.tsx onDragOver (preventDefault) + onDrop; reads object id, finds plugin+base_object+basic product, resolves context, calls window.project.renderProduct.
- [x] inserts rendered text via setFileContent (append for v1; seeds erDiagram header on empty canvas). Canvas re-renders via selectOpenFileContent; Monaco syncs via its external-content effect.
- [x] added basic Mermaid product product/table.can.njk (erDiagram entity block); DDL is no longer basic. Convention documented in PLUGIN_GUIDE.md §1a.
- [x] decisions: append (not drop coords), no de-dup for v1, only object types with a basic product are droppable (others no-op). Documented as v1 limitations.

PHASE 2 — cross-cutting: [DONE]
- [x] kept throwOnUndefined:false (templates rely on it for optional fields); added a dev-only console.warn in resolve-references.ts when a $reference can't be resolved.
- [x] test matrix (logic) — resolver + templates verified via automated test (pure algorithm split into resolve-references.core.ts, 10 assertions pass): object with no refs (unchanged); object with FK to another table (resolves + renders "REFERENCES CUSTOMERS (ID)" through the real DDL template); $sub_reference flattening; depth cap; cycle guard; missing file -> dev warn + empty. Both njk templates render cleanly under the app's Nunjucks env config.
- [x] test matrix (manual GUI acceptance) — USER verified in running app, all 4 pass:
      1. PASS - Table with a FOREIGN KEY: PRODUCT (DDL) pane shows "REFERENCES <parent table name> (<cols>)", not a raw "models/...tbl" id.
      2. PASS - editing the FK's referenced_table updates the DDL live.
      3. PASS - dragging a Table onto an open *.can.md canvas appends an erDiagram entity block that renders.
      4. PASS - dragging a Schema/View/Index (no basic product) onto the canvas is a graceful no-op, no error spam.
