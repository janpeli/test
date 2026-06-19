import simpleGit from "simple-git";
import { assertAbsoluteCleanPath } from "./utils";

// Serializable shapes returned to the renderer over IPC. Deliberately decoupled
// from simple-git's own result types so the renderer never imports simple-git.

export interface GitCommit {
  hash: string;
  message: string;
  author_name: string;
  // ISO-ish date string as produced by `git log` (e.g. simple-git's `date`).
  date: string;
}

export interface GitRemote {
  name: string;
  url: string;
}

export interface GitInfo {
  // false when the folder is not inside a git work tree, or when git is
  // unavailable / errored. Every other field is then at its empty default.
  isRepo: boolean;
  // Current branch name, or null when detached / on an unborn branch.
  branch: string | null;
  // Upstream tracking ref (e.g. "origin/main"), or null when none.
  tracking: string | null;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  deleted: string[];
  // Untracked files (git's "not added").
  not_added: string[];
  conflicted: string[];
  // Most recent commit first.
  commits: GitCommit[];
  remotes: GitRemote[];
}

function emptyGitInfo(isRepo: boolean): GitInfo {
  return {
    isRepo,
    branch: null,
    tracking: null,
    ahead: 0,
    behind: 0,
    staged: [],
    modified: [],
    deleted: [],
    not_added: [],
    conflicted: [],
    commits: [],
    remotes: [],
  };
}

/**
 * Reads read-only git information for `folderPath`. Returns `isRepo: false`
 * (with empty defaults) when the folder is simply not a git repository — an
 * expected state the renderer presents on its own. A genuine git failure
 * (git unavailable, locked index, permissions, corruption, …) is re-thrown so
 * the renderer can surface it as an error rather than mislabel the repo as
 * "not a repository". This handler stays a dumb reader; it never mutates the
 * repository.
 */
export async function getGitInfo(folderPath: string): Promise<GitInfo> {
  assertAbsoluteCleanPath(folderPath);

  try {
    const git = simpleGit({ baseDir: folderPath });

    if (!(await git.checkIsRepo())) {
      return emptyGitInfo(false);
    }

    const [status, log, remotes] = await Promise.all([
      git.status(),
      // `git log` exits non-zero on an unborn branch (a fresh repo with no
      // commits yet), which would otherwise reject the whole read and make a
      // real repository look like "not a repo". Treat that as zero commits.
      git.log({ maxCount: 20 }).catch(() => ({ all: [] as GitCommit[] })),
      git.getRemotes(true),
    ]);

    return {
      isRepo: true,
      branch: status.current ?? null,
      tracking: status.tracking ?? null,
      ahead: status.ahead,
      behind: status.behind,
      staged: status.staged,
      modified: status.modified,
      deleted: status.deleted,
      not_added: status.not_added,
      conflicted: status.conflicted,
      commits: log.all.map((c) => ({
        hash: c.hash,
        message: c.message,
        author_name: c.author_name,
        date: c.date,
      })),
      remotes: remotes.map((r) => ({
        name: r.name,
        url: r.refs.fetch || r.refs.push || "",
      })),
    };
  } catch (e) {
    // A real failure: git is unavailable, or the folder is a repo whose read
    // threw (locked index, permissions, corruption, …). The plain non-repo
    // case already returned above, so don't disguise this as "not a
    // repository" — propagate so the renderer surfaces the actual error.
    console.error("getGitInfo failed for", folderPath, e);
    throw e;
  }
}
