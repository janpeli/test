# {{project_name}}

This is a **data-model project** created with the Modeling Tool — a desktop app
for building YAML-based data models that are validated, visualised, and turned
into generated artifacts (DDL, diagrams, documentation) by plugins.

This file orients both humans and AI assistants (e.g. Claude Code) working
inside this project. It describes the project, not the Modeling Tool's own
source code.

## Project layout

```
{{project_name}}/
├── project.yaml              # project config (currently just project_name)
├── CLAUDE.md                 # this file
├── models/                   # your data models live here
└── plugins/                  # plugin definitions that drive this project
    └── PLUGIN_GUIDE.md       # full reference for authoring/changing plugins
```

- **`project.yaml`** — project-level configuration. Holds `project_name`.
- **`models/`** — the actual model content. Two kinds of files live here:
  - **Object files** — YAML documents describing one object (an entity, table,
    relation, etc.). Each object type defines a file suffix (e.g. `.ent`, `.rel`)
    declared by its plugin. The YAML must conform to that object type's JSON
    Schema, which is what the app's FORM view renders and validates.
  - **Canvas files (`*.can.md`)** — hold **bare Mermaid source** (e.g. an
    `erDiagram` block), not fenced ```` ```mermaid ```` markdown. They render as
    a live diagram in the CANVAS view.
- **`plugins/`** — per-project copies of the plugin definitions. A plugin
  declares the object types available in this project, their form schemas,
  default values, icons, and optional **products** (Nunjucks templates that
  render an object's data into a text artifact such as Oracle DDL). The app
  reads these to generate forms, validate files, and render products.

## Working with models

- **References between objects** are expressed in the YAML as reference nodes:
  - `{ $reference: <object-id> }` resolves to another object's data.
  - `{ $sub_reference: [ ... ] }` resolves to an array from another object.
  These are resolved one level deep when rendering products and diagrams.
- **Object file suffixes** are not arbitrary — each is declared by an object
  type in its plugin's `config.yaml` (`sufix:`). Use the suffix the plugin
  defines.
- **Canvas content** must be Mermaid compatible with the rest of the file. When
  appending an entity block to an `erDiagram` canvas, emit the bare entity block,
  not a fenced code block.

## Changing what the project can model

To add or change object types, form schemas, default values, icons, diagram
defaults, or products, read **`plugins/PLUGIN_GUIDE.md`** — it is the complete
plugin-authoring reference. Each plugin lives in its own subdirectory under
`plugins/` with a `config.yaml` manifest plus its schema, template, and product
files.
