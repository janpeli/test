# Vendored drawio webapp

Pinned snapshot of the pre-built drawio editor webapp, served to the renderer
over the `drawio://` custom protocol for the DRAWIO editor mode.

- Upstream: https://github.com/jgraph/drawio
- Tag: `v31.4.1`
- Commit: `fea5e877f3e6f849331ad09894f7edb9771708fa`
- Source path: `src/main/webapp/`
- License: Apache License 2.0 (see THIRD-PARTY-NOTICES.md). drawio icon/stencil
  assets may not be used in Atlassian products; the draw.io name/logo must not
  be used to suggest affiliation.

## Pruned relative to upstream `src/main/webapp/`

- `WEB-INF/`, `META-INF/`, `connect/`, `monday-app-association.json` — server/integration
- `templates/` — new-from-template gallery (embed mode always loads our XML)
- `mxgraph/` **except `mxgraph/css/` and `mxgraph/images/`** (app.min.js loads those at runtime), `js/diagramly/`, `js/grapheditor/`, `js/gliffy/`, `js/orgchart/` — unminified dev sources (`?dev=1` only)
- `math4/` is **kept** (app.min.js loads `math4/es5/startup.js` at boot), minus `*.map`
- `js/integrate.min.js`, `js/viewer.min.js`, `js/viewer-static.min.js` — bundles index.html never loads
- `service-worker.js`, `workbox-*.js` — PWA offline cache (we serve from disk)
- `*.html` integration pages (dropbox/github/gitlab/onedrive/teams/export/open/clear/vsdxImporter)
- `resources/dia_*.txt` — non-English locales (kept `resources/dia.txt`)
- all `*.map` files

To refresh, see `scripts/update-drawio.md`.
