# Updating the vendored drawio webapp

The DRAWIO editor mode serves a pinned copy of the drawio webapp from
`data/drawio-webapp/` (see `data/drawio-webapp/DRAWIO_VERSION.md` for the
current tag/commit and the prune list). To upgrade:

1. Pick a release tag from https://github.com/jgraph/drawio/releases.
2. Sparse-clone just the webapp (fast; avoids the full repo):

   ```bash
   git clone --depth 1 --branch vX.Y.Z --filter=blob:none --sparse \
     https://github.com/jgraph/drawio.git /tmp/drawio-src
   cd /tmp/drawio-src && git sparse-checkout set src/main/webapp
   ```

3. Replace `data/drawio-webapp/` with `/tmp/drawio-src/src/main/webapp/` and
   re-apply the prune list from `DRAWIO_VERSION.md` (server dirs, dev sources,
   unused bundles, service worker, integration pages, non-English locales,
   `*.map`). Copy the repo-root `LICENSE` to `data/drawio-webapp/LICENSE`
   (the notices generator reads it).
4. Update `DRAWIO_VERSION.md` (tag, `git log -1` commit SHA, any prune changes)
   and the drawio entry version in `scripts/generate-notices.cjs`.
5. Verify: `npm test` (protocol/embed tests), then `npm run dev` — open a
   `.drawio` file, check the editor boots offline, the embed handshake still
   works (drawio occasionally changes embed-mode URL parameters between major
   versions — see `buildDrawioUrl` in
   `src/features/Editor/drawio-editor/drawio-embed.core.ts`), and the devtools
   console shows no failing requests other than known-pruned paths.
