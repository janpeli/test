/**
 * Generates THIRD-PARTY-NOTICES.md — the attribution bundle shipped with the app.
 *
 * Why a wrapper (and not just `generate-license-file`): this project keeps its
 * *runtime* libraries (React, Radix, mermaid, monaco, fonts, …) under
 * `devDependencies` because Vite bundles them at build time. A production-only
 * scan would therefore miss almost everything that actually ships. We instead
 * walk the full installed tree via license-checker-rseidelsohn — over-inclusive
 * (a handful of build-only dev tools are attributed too), which is legally safe:
 * attributing more than required never creates a compliance problem, under-
 * attributing does. The header below records the three judgment calls from the
 * license audit (dompurify election, resvg MPL source pointer, OFL fonts).
 *
 * Run: `npm run generate-notices` (also runs automatically as part of `npm run build`).
 */
const path = require("path");
const fs = require("fs");
const checker = require("license-checker-rseidelsohn");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "THIRD-PARTY-NOTICES.md");

const HEADER = `# Third-Party Notices

This application incorporates third-party software. The full text of each
component's license is reproduced below. This file is generated automatically
by \`scripts/generate-notices.cjs\` (\`npm run generate-notices\`) and is
regenerated on every \`npm run build\` — do not edit it by hand.

It covers **all installed dependencies** (both runtime and build-time). This
project bundles its runtime libraries at build time via Vite and declares them
under \`devDependencies\`, so a production-only scan would omit shipped code;
listing the full tree is deliberate and errs on the side of over-attribution.

## Notes on specific components

- **@resvg/resvg-js** and **@resvg/resvg-js-<platform>** — Mozilla Public
  License 2.0 (weak, file-level copyleft). Used unmodified as a library; the
  corresponding source is available from the upstream project at
  https://github.com/thx/resvg-js. MPL-2.0 does not affect the license of this
  application as a whole.
- **dompurify** — dual-licensed "MPL-2.0 OR Apache-2.0". This project **elects
  the Apache License 2.0** for its use of DOMPurify.
- **jszip** — dual-licensed "MIT OR GPL-3.0-or-later". This project **elects the
  MIT license**.
- **@fontsource/inter, @fontsource/ibm-plex-sans, @fontsource/ibm-plex-mono,
  @fontsource/jetbrains-mono** — the bundled fonts are licensed under the SIL
  Open Font License 1.1; their license text is retained below.
- **Electron** itself is MIT-licensed, but the packaged runtime additionally
  bundles Chromium, V8, Node.js, and ffmpeg under their own (permissive)
  licenses. See the \`LICENSES.chromium.html\` file produced in the Electron
  distribution for those texts.
`;

const options = {
  start: ROOT,
  excludePrivatePackages: true, // drops the app package itself (private: true)
  customFormat: {
    name: "",
    version: "",
    licenses: "",
    publisher: "",
    repository: "",
    licenseText: "",
  },
};

checker.init(options, (err, packages) => {
  if (err) {
    console.error("[generate-notices] failed:", err);
    process.exit(1);
  }

  const entries = Object.entries(packages)
    .map(([id, info]) => ({ id, ...info }))
    .sort((a, b) => a.id.toLowerCase().localeCompare(b.id.toLowerCase()));

  // License → count summary.
  const counts = {};
  for (const e of entries) {
    const lic = normalizeLicense(e.licenses);
    counts[lic] = (counts[lic] || 0) + 1;
  }
  const summary = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([lic, n]) => `| ${escapePipes(lic)} | ${n} |`)
    .join("\n");

  const body = entries.map(renderPackage).join("\n");

  const out = `${HEADER}
## Summary

${entries.length} components.

| License | Components |
|---------|-----------:|
${summary}

---

${body}`;

  fs.writeFileSync(OUT, out, "utf8");
  console.log(
    `[generate-notices] wrote ${path.relative(ROOT, OUT)} (${entries.length} components)`,
  );
});

function normalizeLicense(lic) {
  if (!lic) return "UNKNOWN";
  return Array.isArray(lic) ? lic.join(" OR ") : String(lic);
}

function escapePipes(s) {
  return s.replace(/\|/g, "\\|");
}

function renderPackage(e) {
  const license = normalizeLicense(e.licenses);
  const meta = [];
  if (e.publisher) meta.push(`Publisher: ${e.publisher}`);
  if (e.repository) meta.push(`Repository: ${e.repository}`);
  const metaLine = meta.length ? `\n${meta.join("  \n")}` : "";

  const text =
    e.licenseText && e.licenseText.trim()
      ? e.licenseText.trim()
      : `No license text file was found in the package. Declared license: ${license}.`;

  return `### ${e.name} \`${e.version}\`

License: ${license}${metaLine}

\`\`\`
${text}
\`\`\`
`;
}
