import { closeModals } from "@/API/GUI-api/modal-api";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CaseSensitive, Regex, WholeWord } from "lucide-react";

// One entry in the regex quick-reference table.
type Token = { token: string; desc: string; example: string };

// Rust-regex (ripgrep / RE2-style) tokens — the flavour enabled by the regex
// toggle. Deliberately excludes lookaround/backreferences: they are not
// supported (called out separately below).
const REGEX_TOKENS: Token[] = [
  { token: ".", desc: "Any single character", example: "a.c → abc, axc" },
  { token: "*", desc: "Zero or more of the previous", example: "ab* → a, ab, abb" },
  { token: "+", desc: "One or more of the previous", example: "ab+ → ab, abb" },
  { token: "?", desc: "Zero or one of the previous", example: "ab? → a, ab" },
  { token: "{2,4}", desc: "Between 2 and 4 repeats", example: "a{2,4} → aa, aaa" },
  { token: "[abc]", desc: "Any one listed character", example: "[aeiou]" },
  { token: "[^abc]", desc: "Any character not listed", example: "[^0-9]" },
  { token: "\\d \\w \\s", desc: "Digit, word char, whitespace", example: "\\d\\d → 42" },
  { token: "^ $", desc: "Start / end of a line", example: "^name:" },
  { token: "\\b", desc: "Word boundary", example: "\\bid\\b" },
  { token: "a|b", desc: "Either side (alternation)", example: "yes|no" },
  { token: "( )", desc: "Group / capture", example: "(ab)+ → abab" },
];

// Read-only informational modal opened from the Search panel's help button.
// Static content only — no project state, no actions beyond dismissing.
function ModalSearchHelp() {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus the Close button so both Enter and Esc dismiss the modal.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Search help</DialogTitle>
        <DialogDescription>
          Full-text search across every file in the open project. Type a query
          and press Enter or click the search button.
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-[70vh] overflow-y-auto pr-1 flex flex-col gap-5 text-sm">
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-foreground">Options</h3>
          <ul className="flex flex-col gap-2">
            <li className="flex items-start gap-2">
              <CaseSensitive className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>
                <span className="font-medium">Match case</span> — off by default,
                so <code className="text-xs">Name</code> also finds{" "}
                <code className="text-xs">name</code>. Turn on to match capital
                letters exactly.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <WholeWord className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>
                <span className="font-medium">Match whole word</span> — only
                matches when the query stands alone, not inside a larger word
                (searching <code className="text-xs">id</code> skips{" "}
                <code className="text-xs">valid</code>).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Regex className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>
                <span className="font-medium">Regular expression</span> — treat
                the query as a pattern instead of literal text (see below). When
                off, the query is matched as-is, so characters like{" "}
                <code className="text-xs">.</code> or{" "}
                <code className="text-xs">*</code> are searched literally.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-xs font-medium text-muted-foreground">
                files
              </span>
              <span>
                Restrict the search with glob patterns to{" "}
                <span className="font-medium">include</span> or{" "}
                <span className="font-medium">exclude</span> (e.g.{" "}
                <code className="text-xs">*.yaml</code>). Separate multiple
                patterns with commas.
              </span>
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-foreground">Regular expressions</h3>
          <p className="text-muted-foreground">
            With the regex option on, the query is a pattern. Matching is
            case-insensitive unless <span className="font-medium">Match case</span>{" "}
            is also on.
          </p>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-2 py-1.5 font-medium">Token</th>
                  <th className="px-2 py-1.5 font-medium">Meaning</th>
                  <th className="px-2 py-1.5 font-medium">Example</th>
                </tr>
              </thead>
              <tbody>
                {REGEX_TOKENS.map((t) => (
                  <tr key={t.token} className="border-t">
                    <td className="px-2 py-1.5 align-top">
                      <code className="text-xs whitespace-nowrap">{t.token}</code>
                    </td>
                    <td className="px-2 py-1.5 align-top">{t.desc}</td>
                    <td className="px-2 py-1.5 align-top text-muted-foreground">
                      <code className="text-xs">{t.example}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted-foreground">
            To search for one of these characters literally, escape it with a
            backslash — e.g. <code className="text-xs">3\.14</code> or{" "}
            <code className="text-xs">\$name</code>.
          </p>
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
            <span className="font-medium">Not supported:</span> lookaround
            (<code>(?=…)</code>, <code>(?!…)</code>) and backreferences
            (<code>\1</code>). Patterns using them will not match.
          </div>
        </section>
      </div>

      <DialogFooter>
        <Button ref={closeRef} variant="secondary" onClick={closeModals}>
          Close
        </Button>
      </DialogFooter>
    </>
  );
}

export default ModalSearchHelp;
