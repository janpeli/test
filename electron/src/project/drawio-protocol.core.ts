import path from "node:path";

/**
 * Pure helpers for the drawio:// protocol that serves the vendored drawio
 * webapp (data/drawio-webapp) to the renderer's iframe. Kept free of Electron
 * imports so it can be unit-tested (see drawio-protocol.core.test.ts).
 */

const MIME_BY_EXT: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".json": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

export function getDrawioMimeType(filePath: string): string {
  return (
    MIME_BY_EXT[path.extname(filePath).toLowerCase()] ??
    "application/octet-stream"
  );
}

/**
 * Maps a drawio:// URL pathname to an absolute file path inside rootDir.
 * Returns null for anything that would escape rootDir (traversal, absolute
 * Windows paths, encoded dots) — the protocol handler answers 404 for those.
 * An empty pathname serves index.html.
 */
export function resolveDrawioPath(
  urlPathname: string,
  rootDir: string
): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(urlPathname);
  } catch {
    return null;
  }
  // Strip query/hash remnants defensively; URL should already have removed them.
  decoded = decoded.replace(/[?#].*$/, "");
  const relative = decoded.replace(/^\/+/, "");
  if (relative.includes("\0")) return null;

  const target = relative === "" ? "index.html" : relative;
  const resolvedRoot = path.resolve(rootDir);
  const resolved = path.resolve(resolvedRoot, target);
  if (
    resolved !== resolvedRoot &&
    !resolved.startsWith(resolvedRoot + path.sep)
  ) {
    return null;
  }
  return resolved;
}
