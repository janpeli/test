# Plugin Definition Guide

A plugin defines one or more **object types** (entities, tables, relations, etc.) for a modeling domain. The tool reads plugins from `data/plugins/` — each plugin lives in its own subdirectory.

---

## Directory Structure

```
data/plugins/
└── My-Plugin-Name/
    ├── config.yaml              # required — plugin manifest
    ├── model_schema.yaml        # required — schema for the model-level metadata file
    ├── plugin-icon.png          # optional — shown in the plugin picker
    ├── definition/
    │   ├── entity.schm.yaml     # object schema (drives the form)
    │   └── relation.schm.yaml   # another object type
    └── template/
        ├── default.entity.tmpl.yaml   # new-file default values
        └── default.relation.tmpl.yaml
```

---

## 1. `config.yaml` — Plugin Manifest

```yaml
name: Conceptual Data Model          # display name (required)
description: A high-level description of informational needs...  # required
uuid: 18c8c251-8194-40c2-8464-7bae5c56de4a   # unique — generate once, never change
target_db: None                      # target database (use "None" if not applicable)
parser: None                         # parser type (use "None" if not applicable)
image: ./plugin-icon.png             # optional image, relative to this file
model_schema: ./model_schema.yaml    # required — path to model-level schema
default_canvas_type: erDiagram       # optional — Mermaid diagram keyword seeded into new canvas files

base_objects:
  - name: Entity                     # display name in the UI
    definition: ./definition/entity.schm.yaml   # path to the JSON Schema form definition
    template: ./template/default.entity.tmpl.yaml  # path to new-file defaults
    archetype: entity                # "entity" or "relation"
    sufix: ent                       # file extension used by this object type (no dot)
    icon: ./icons/entity.svg         # optional — shown in the treeview and tab strip (PNG or SVG)

  - name: Relation
    definition: ./definition/relation.schm.yaml
    template: ./template/default.relation.tmpl.yaml
    archetype: relation
    sufix: rel
```

**Rules:**
- `uuid` must be unique across all plugins. Generate it once (e.g. via `uuidgen`) and never change it — it is used to locate the plugin when projects are opened.
- `sufix` (note: spelled without double-f throughout the codebase) is the file extension for objects of that type. It must be unique within the plugin. Used by `$reference` fields to filter which files appear in the picker.
- `archetype` controls how the tool treats the object: `entity` = standalone node, `relation` = edge between entities.
- `description`, `target_db`, `parser`, and `uuid` are all required by the validator — `target_db` and `parser` can be `"None"` as strings.
- `template` can be `null`/omitted if you don't want default file content.
- `default_canvas_type` is an optional plugin-wide Mermaid diagram keyword (e.g. `erDiagram`, `flowchart LR`). When a canvas (`*.can.md`) is created inside a model belonging to this plugin, the file is seeded with this keyword on its first line (raw Mermaid, not a fenced block). Omit it to fall back to the generic flowchart placeholder.

---

## 1a. Products — Generated Text from an Object

A **product** is a template bound to an object type. Applying a product to an
object instance generates a text artifact — e.g. the DDL that creates an Oracle
table. An object type can declare any number of products; each is offered in the
editor's **PRODUCT** dropdown, which renders the selected product into a
read-only Monaco pane (with a copy button) alongside the form.

Declare products under a `base_object` in `config.yaml`:

```yaml
- name: Table
  definition: ./definition/table.schm.yaml
  template: ./template/default.table.tmpl.yaml
  archetype: entity
  sufix: tbl
  products:
    - name: DDL                       # label shown in the PRODUCT dropdown
      definition: ./product/table.ddl.njk   # Nunjucks template, inlined on load
      language: sql                   # optional — Monaco syntax highlighting
      basic: true                     # optional — the product used for canvas drag
```

By convention product templates live in a `product/` subdirectory. The
`definition` path is replaced with the template's contents when the plugin
loads (same as `definition`/`template` for the object schema).

**Template engine:** [Nunjucks](https://mozilla.github.io/nunjucks/). Rendering
runs with `autoescape: false` (output is SQL/text, not HTML),
`throwOnUndefined: false` (referencing an unset field yields empty, not an
error), and `trimBlocks`/`lstripBlocks` on. Because of `trimBlocks`, a line that
*ends* in a `{% … %}` block tag has its trailing newline stripped — emit
line-final conditionals as inline `{{ "," if cond else "" }}` expressions
instead. See `Oracle-Physical-Data-Model/product/table.ddl.njk` for a worked
example.

**Template context:** the parsed data of the object being edited (live form data
while editing, so the PRODUCT view updates as you type), with cross-file
references resolved one level deep:

- a `{ $reference: "<file id>" }` field becomes the **referenced object's data**,
  so a template reads `c.referenced_table.general.name` (it falls back to the raw
  reference id when the file is missing or the reference is deeper than one level)
- a `{ $sub_reference: [..] }` field becomes its **stored array** of picked
  values, so a template reads `c.referenced_columns | join(', ')`

Resolution follows direct references only (one hop) and guards against cycles and
missing files. See `src/lib/products/resolve-references.ts`.

**Basic product (`basic: true`):** marks the product rendered when the object is
dragged from the treeview onto a **canvas** (`*.can.md`). Its template must emit
Mermaid-compatible text — an `erDiagram` entity block for the example Oracle
table (see `product/table.can.njk`), *not* DDL. The canvas drop handler appends
the rendered block, seeding an `erDiagram` header on an empty canvas. Only object
types that declare a basic product are droppable; others are a no-op. v1 appends
(Mermaid has no stable text-position mapping for drop coordinates) and does not
de-duplicate repeated drops.

---

## 2. `model_schema.yaml` — Model Metadata Schema

This schema drives the form shown when editing the **model-level** file (not individual objects). Follow the same schema rules as object schemas (see §3). Minimal example:

```yaml
$schema: "https://json-schema.org/draft/2020-12/schema"
title: My Model
type: object
properties:
  general:
    type: object
    title: General
    required:
      - Name
    properties:
      plugin_uuid:
        title: Plugin UUID
        type: string
      Name:
        title: Name
        type: string
      Description:
        title: Description
        type: string
        format: text
```

---

## 3. Object Schema (`*.schm.yaml`) — The Form Definition

This is the core file. It is a **YAML-encoded JSON Schema** with custom extensions. The schema must have `type: object` at the root. Its top-level `properties` become the **navigation tabs** in the left sidebar of the form editor.

### 3.1 Root Structure

```yaml
$schema: "https://json-schema.org/draft/2020-12/schema"
title: My Object
type: object
properties:
  general:          # becomes tab "General" in the sidebar
    ...
  attributes:       # becomes tab "Attributes"
    ...
  physical_options: # becomes tab "Physical options"
    ...
```

Each top-level property key is displayed using its `title` if provided, otherwise the key name.

---

### 3.2 Field Types and Their Form Controls

#### Plain text input
```yaml
name:
  title: Name
  description: The canonical name of this object
  type: string
```
Renders as a single-line `<Input>`.

#### Multi-line textarea
```yaml
comment:
  title: Description
  type: string
  format: text       # custom extension — not standard JSON Schema
```
Renders as a `<Textarea>` and spans 2 columns in the grid.

#### Dropdown (combobox with search)
```yaml
datatype:
  title: Datatype
  type: string
  enum:
    - INT
    - VARCHAR
    - TEXT
    - BOOLEAN
```
Any `type: string` with `enum` renders as a searchable combobox popover.

#### Integer input
```yaml
size:
  title: Size
  type: integer
```

#### Number input
```yaml
ratio:
  title: Ratio
  type: number
```

#### Checkbox
```yaml
nullable:
  title: Nullable
  description: Whether this attribute may be null
  type: boolean
```

#### Tag chip input
Two ways to get a tag input:

```yaml
# Option A: array of strings (any key)
allowed_values:
  title: Allowed values
  type: array
  items:
    type: string

# Option B: special key "tags" inside a "general" object (hardcoded recognition)
tags:
  title: Tags
  type: array
  items:
    type: string
```

---

### 3.3 Grouping Fields with Nested Objects

A `type: object` with `properties` renders as a collapsible **Section** with its children in a 2-column grid:

```yaml
physical_options:
  type: object
  title: Physical options
  description: Storage-level options
  properties:
    strict:
      title: Strict
      type: boolean
    without_rowid:
      title: Without rowid
      type: boolean
```

Objects nest recursively — sections inside sections are valid.

---

### 3.4 Tables (Arrays of Objects)

A `type: array` whose `items` is a `type: object` renders as a table with an **Add row** button:

```yaml
attributes:
  title: Attributes
  type: array
  items:
    type: object
    description: Attribute definition
    required:
      - name
    Unique_properties:      # custom extension — marks columns that must be unique (not enforced in UI yet)
      - name
    properties:
      name:
        title: Attribute name
        type: string
      comment:
        title: Description
        type: string
      nullable:
        title: Nullable
        type: boolean
```

**Table column vs. expanded row:** Each property of `items.properties` is classified automatically:

| Goes in the table column (inline) | Goes in the expanded row (click chevron) |
|---|---|
| `string`, `integer`, `number`, `boolean` | `type: object` (unless it is a reference/sub-reference) |
| `type: string` with `enum` (combobox) | `type: array` with non-string items |
| `type: array` with `items.type === "string"` (tags) | — |
| `format: reference` or `format: sub-reference` | — |

If any fields end up in the expanded row, each row gets an expand/collapse chevron button.

---

### 3.5 Cross-File Reference (`$reference`)

Links to another file in the project (file picker):

```yaml
referenced_table:
  title: Referenced table
  type: object
  format: reference          # custom extension — signals to table cell renderer
  properties:
    $reference:              # special key — must be exactly "$reference"
      type: string
      format: uri-reference
      sufix:                 # custom extension — filter by file extension
        - tbl                # only show files with .tbl extension
```

- `format: reference` on the outer object is only needed when the field appears inside a **table column** — it tells the table cell classifier to render it inline rather than in the expanded row.
- `sufix` is a list — you can specify multiple extensions: `[ent, tbl]`.
- The stored YAML value will be `{ $reference: "path/to/file.tbl" }`.

---

### 3.6 Sub-Reference — Value Picker from Another File (`$sub_reference`)

Populates a dropdown from values inside another file (or from the current form's data), using JSONPath:

```yaml
referenced_column:
  title: Referenced column
  type: object
  format: sub-reference      # custom extension — for table column classification
  properties:
    $sub_reference:          # special key — must be exactly "$sub_reference"
      type: string           # "string" = single-select, "array" = multi-select
      JSONPath: "$.columns[*].column_name"
```

**Three resolution strategies** (listed in priority order):

**Strategy 1 — `file_property`** (look up a sibling field's referenced file):
```yaml
referenced_column:
  type: object
  format: sub-reference
  properties:
    $sub_reference:
      type: string
      JSONPath: "$.columns[*].column_name"   # path inside the referenced file
      file_property: referenced_table         # sibling field (in the same parent object) that holds a $reference
```
The tool navigates to the sibling `referenced_table.$reference`, loads that file, then runs `JSONPath` against it.

**Strategy 2 — `file_JSONPath`** (JSONPath against the whole form to find the file reference):
```yaml
referenced_column:
  type: object
  format: sub-reference
  properties:
    $sub_reference:
      type: array                               # multi-select
      items:
        type: string
      JSONPath: "$.columns[*].column_name"      # path inside the referenced file
      file_JSONPath: "$.foreign_key.referenced_table"  # JSONPath into the current form to find a $reference value
```

**Strategy 3 — `JSONPath` only** (no file, query current form data):
```yaml
key_attributes:
  type: array
  items:
    type: object
    format: sub-reference
    properties:
      $sub_reference:
        type: string
        JSONPath: "$.attributes[*].name"    # runs against the current file's form values
```

For **multi-select** sub-reference, set `type: array` on `$sub_reference` (and optionally add `items: { type: string }`). This renders with removable pill badges instead of a single value display.

---

### 3.7 Conditional Field — `valid_for`

Disables a field (and clears its value) when a sibling field's value is not in a given list. The sibling must be in the **same parent object**.

```yaml
size:
  title: Size
  type: integer
  valid_for:
    property: datatype       # sibling field name to watch
    enum:                    # values that ENABLE this field
      - VARCHAR
      - NVARCHAR
      - CHARACTER
```

When `datatype` is set to anything not in the enum, the `size` field is greyed out and its value is cleared on save.

Works on all field types including booleans, comboboxes, references, and sub-references. In a table, it watches the sibling within the same row.

---

### 3.8 Required Fields

```yaml
items:
  type: object
  required:
    - name
    - datatype
  properties:
    name:
      type: string
    datatype:
      type: string
      enum: [...]
```

- Required string fields get `.min(1)` validation — blank values will fail form validation.
- Required fields are not wrapped in `.optional()` in the Zod schema.
- Non-required fields are always optional — they can be absent from the saved YAML.

---

### 3.9 `title` and `description`

```yaml
column_name:
  title: Column name        # shown as the field label / table column header
  description: Column name in DB  # shown in the tooltip on hover
  type: string
```

- If `title` is omitted, the property key name is used as the label.
- `description` is tooltip-only — it never appears as permanent visible text (except inside `boolean` fields where it renders below the label).

---

## 4. Template File (`*.tmpl.yaml`) — New-File Defaults

The template is a plain YAML file whose structure must match the object schema. It is used as the initial content when a new object of this type is created.

```yaml
# default.entity.tmpl.yaml
general:
  name: ""
  comment: ""
  template: ""
  tags: []
attributes:
  - name: ""
    comment: ""
```

**Rules:**
- Must be valid YAML that the schema can parse without errors.
- Arrays can be pre-populated with one empty row (as above) or left as `[]`.
- Reference fields should be `{}` (empty object).
- Boolean fields should default to `false`, integers and strings to `""`.

---

## 5. Complete Example — Adding a New Object Type

Suppose you are adding a **View** object to a physical model plugin.

**Step 1** — Add to `config.yaml`:
```yaml
base_objects:
  - name: View
    definition: ./definition/view.schm.yaml
    template: ./template/default.view.tmpl.yaml
    archetype: entity
    sufix: vw
```

**Step 2** — Create `definition/view.schm.yaml`:
```yaml
$schema: "https://json-schema.org/draft/2020-12/schema"
title: View
type: object
properties:
  general:
    type: object
    title: General
    required:
      - name
    properties:
      name:
        title: Name
        type: string
      comment:
        title: Description
        type: string
        format: text
      tags:
        title: Tags
        type: array
        items:
          type: string

  view_definition:
    type: object
    title: View definition
    properties:
      schema_name:
        title: Schema name
        type: string
      view_name:
        title: View name
        type: string
      source_table:
        title: Source table
        type: object
        format: reference
        properties:
          $reference:
            type: string
            format: uri-reference
            sufix:
              - tbl

  columns:
    title: Columns
    type: array
    items:
      type: object
      required:
        - column_name
      Unique_properties:
        - column_name
      properties:
        column_name:
          title: Column name
          type: string
        source_column:
          title: Source column
          description: Column from the source table
          type: object
          format: sub-reference
          properties:
            $sub_reference:
              type: string
              JSONPath: "$.columns[*].column_name"
              file_property: source_table
        nullable:
          title: Nullable
          type: boolean
```

**Step 3** — Create `template/default.view.tmpl.yaml`:
```yaml
general:
  name: ""
  comment: ""
  tags: []
view_definition:
  schema_name: ""
  view_name: ""
  source_table: {}
columns: []
```

---

## 6. Quick Reference — Custom Extensions Summary

| Extension | Where used | Effect |
|---|---|---|
| `format: text` | `type: string` field | Renders `<Textarea>` instead of `<Input>`, spans 2 grid columns |
| `format: reference` | `type: object` field | Marks the object as a file-reference (for table column classification) |
| `format: sub-reference` | `type: object` field | Marks the object as a sub-reference picker (for table column classification) |
| `properties.$reference` | Inside a `type: object` | Makes the field a cross-file picker |
| `$reference.sufix` | Inside `$reference` | List of file extensions to show in the picker |
| `properties.$sub_reference` | Inside a `type: object` | Makes the field a value-picker from another file or the current form |
| `$sub_reference.type: array` | On `$sub_reference` | Multi-select mode (pills UI) |
| `$sub_reference.JSONPath` | On `$sub_reference` | JSONPath to extract values from the resolved source |
| `$sub_reference.file_property` | On `$sub_reference` | Sibling field name containing the source file reference |
| `$sub_reference.file_JSONPath` | On `$sub_reference` | JSONPath into the form to find the source file reference |
| `valid_for.property` + `.enum` | Any field | Disables and clears the field when the named sibling is not in the enum |
| `Unique_properties` | On array `items` object | Declares which column should be unique (declared but not yet enforced in UI) |
