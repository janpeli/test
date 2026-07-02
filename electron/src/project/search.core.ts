/**
 * Pure helpers for full-text project search (no app/electron imports) so the
 * argument-building and output-parsing can be unit-tested in isolation with
 * esbuild + a throwaway Node script. Matching itself is delegated to ripgrep
 * (see `search.ts`); this module only translates options into `rg` arguments
 * and parses `rg --count-matches` output back into results.
 */

export interface SearchOptions {
  /** Case-sensitive matching. Default (false) = case-insensitive. */
  caseSensitive: boolean;
  /** Treat the query as a regular expression (Rust regex syntax) instead of a literal. */
  regex: boolean;
  /** Match whole words only. */
  wholeWord: boolean;
  /** Comma/newline-separated globs of files to include ("" = all). */
  include: string;
  /** Comma/newline-separated globs of files to exclude. */
  exclude: string;
}

export interface SearchResult {
  /** Project-relative path, "/"-separated — matches a ProjectStructure node id. */
  id: string;
  /** Total number of match occurrences in the file. */
  matchCount: number;
}

/**
 * Splits a user-entered glob field into trimmed, non-empty patterns. Separates
 * on commas and newlines only (not spaces — folder names may contain spaces).
 */
export function splitGlobList(input: string): string[] {
  return input
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Assembles the ripgrep argument array from the query + options.
 *
 * Fixed flags:
 *   --count-matches   per-file occurrence counts ("path:count" output)
 *   --no-ignore       ignore .gitignore/.ignore so the search set matches the
 *                     ProjectStructure tree (built by a raw recursive readdir
 *                     with no filtering — gitignored files are in it and
 *                     openable), whose ids are what result clicks open
 *   --hidden          include dotfiles (they are in the structure too)
 *   --no-messages     don't print per-file open/read errors (note: rg still
 *                     exits 2 when such an error occurred — see search.ts)
 *   --color never     deterministic, uncolored output
 *   -g "!.git/**"     but always skip the git directory
 *
 * Option-driven:
 *   -i        unless caseSensitive
 *   -F        unless regex (fixed-string = literal substring)
 *   -w        if wholeWord (composes with both literal and regex)
 *   -g <glob> / -g "!<glob>"   per include / exclude pattern
 *   -e <query>   the pattern (via -e so a leading "-" isn't read as a flag)
 *   .            search the working directory (set to the project folder)
 */
export function buildRgArgs(query: string, opts: SearchOptions): string[] {
  const args: string[] = [
    "--count-matches",
    "--no-ignore",
    "--hidden",
    "--no-messages",
    "--color",
    "never",
    "-g",
    "!.git/**",
  ];

  if (!opts.caseSensitive) args.push("-i");
  if (!opts.regex) args.push("-F");
  if (opts.wholeWord) args.push("-w");

  for (const glob of splitGlobList(opts.include)) args.push("-g", glob);
  for (const glob of splitGlobList(opts.exclude)) args.push("-g", `!${glob}`);

  args.push("-e", query, ".");
  return args;
}

/**
 * Parses one `rg --count-matches` output line ("path:count"). Splits on the
 * LAST ":" (the count never contains one), normalizes "\" to "/" and strips a
 * leading "./" so ids match ProjectStructure ids. Returns null for
 * malformed/blank lines (e.g. a path with a stray ":" and no count) — the
 * count token must round-trip through String(parseInt).
 */
export function parseCountMatchesLine(rawLine: string): SearchResult | null {
  const line = rawLine.replace(/\r$/, "");
  if (!line) return null;

  const idx = line.lastIndexOf(":");
  if (idx <= 0) return null;

  const countStr = line.slice(idx + 1).trim();
  const count = Number.parseInt(countStr, 10);
  if (!Number.isFinite(count) || String(count) !== countStr) return null;

  let id = line.slice(0, idx).replace(/\\/g, "/");
  if (id.startsWith("./")) id = id.slice(2);
  if (!id) return null;

  return { id, matchCount: count };
}

/**
 * Parses a whole `rg --count-matches` output blob (one "path:count" line per
 * matching file). Malformed/blank lines are skipped.
 */
export function parseCountMatchesOutput(stdout: string): SearchResult[] {
  const results: SearchResult[] = [];
  for (const rawLine of stdout.split("\n")) {
    const result = parseCountMatchesLine(rawLine);
    if (result) results.push(result);
  }
  return results;
}
