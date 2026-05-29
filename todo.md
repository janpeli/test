- [x] add canvas functionality, create canvas in context menu on treeview and menubar, (make a file that contains mermaid), opened file should look similar to how mermaid.live works, canvas , source editor in monaco resize bar, file should be named *.can.md, editor menubar should be able to turn on and off source, 
- [x] implement deleting files. model (config) cant be deleted before all files belonging into it are deleted. from context menu in treeview.
- [x] after creating markdown file it should be autoopened.
- [x] after creating canvas file it should be autoopened.
- [x] moving files drag and drop in treeview. files that represent a object should only be able to be moved between folders that are in the same model. if drag and drop outside of parent model then do not move and add error to error pane.
- [~] create functionality to add products to plugins. A product is a template that belongs to a object type and applying the template to product a resulting text is generated. it should be a definition in a templating engine. in editor there should be a button or dropdown that switches monaco to view the product. you can have multiple products for a object type. e.g. the product of oracle table is a ddl query which creates the table. basic product of a object is also used for inserting data into canvas if the object is draged from treebview on to canvas.
  - [x] PHASE 1 (commit f7d2357): products[] in config.yaml, Nunjucks templates rendered in main process (CSP blocks eval in renderer), read-only PRODUCT pane + copy button, dropdown in editor menubar. Context = object's OWN data only. See PLUGIN_GUIDE.md §1a, CLAUDE.md "Products".

PHASE 2 — resolve $reference fields in product context:
- [ ] today selectOpenFileData (src/API/editor-api/editor-api.selectors.ts) passes own data only, so $reference fields render as raw values (e.g. FK referenced_table shows "models/ORG.tbl"). resolve them to the referenced objects' data.
- [ ] reference shapes (see definition/table.schm.yaml): format:reference -> { $reference: "<file id>" } filtered by sufix; format:sub-reference -> { $sub_reference: [..] } with a JSONPath, optionally scoped via file_property to another field (e.g. referenced_columns resolves against referenced_table).
- [ ] approach: resolve in the RENDERER (it has projectStructure + can read any file), build the full context, then pass to window.project.renderProduct. keep main's renderProduct a dumb template renderer.
- [ ] add src/lib/products/resolve-references.ts: resolveProductContext(data, { projectStructure, folderPath }). walk data; for { $reference } load that file's data (reuse getFileContentById + yaml.parse, prefer editorForms[id] when the file is open). resolve $sub_reference after its target using its file_property + JSONPath (jsonpath dep already installed).
- [ ] decide resolved shape exposed to templates (suggestion: replace ref node with referenced object's data so templates do c.referenced_table.general.name) and document it in PLUGIN_GUIDE.md (currently says refs are NOT resolved).
- [ ] guard against cycles + missing files, cap recursion depth (start with 1 level / direct refs only).
- [ ] product-editor.tsx: resolution needs async IPC file reads -> resolve before calling renderProduct, keep existing debounce/race-guard. update example product/table.ddl.njk to use resolved FK name+columns and re-verify.

PHASE 2 — canvas drag-to-insert (drag object from treeview onto canvas inserts its basic product):
- [ ] no canvas drop infra exists yet. basic product = products[].basic === true (currently parsed but unused).
- [ ] drag source: treeview already does internal drag for moving files (node-controller.ts, commit 15e009d). also set a typed payload for external targets, e.g. dataTransfer.setData("application/x-model-object", node.id). distinguish internal reorder vs external insert by the data key so move behavior isn't broken.
- [ ] drop target: add onDragOver (preventDefault) + onDrop to canvas-editor.tsx container. on drop read object id, find its plugin+base_object+basic product, build/resolve context (reuse phase 2 resolver), call window.project.renderProduct.
- [ ] insert rendered text into canvas file content via setFileContent (editor-api.slice.ts) - append for v1 (Mermaid has no stable text-position mapping). canvas re-renders automatically via selectOpenFileContent.
- [ ] basic product template must emit canvas/Mermaid-compatible text (entity node line), not DDL. add a basic product to example object type(s) + document convention.
- [ ] open questions: insert position (append vs drop coords), de-dup on double drop, which archetypes are droppable (entities only?).

PHASE 2 — cross-cutting:
- [ ] once refs resolve, reconsider throwOnUndefined:false (silent empties may hide resolution bugs); consider a dev-only warning when a $reference can't be resolved.
- [ ] manual test matrix: object with no refs; object with FK to another table; drag entity onto canvas; drag object with no basic product (should no-op gracefully).
