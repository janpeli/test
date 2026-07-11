import { Badge } from "@/components/ui/badge";
import type { FrontmatterData } from "./frontmatter.core";

const LINK_RE = /^(https?:\/\/|mailto:)/i;

function isScalar(v: unknown): v is string | number | boolean {
  const t = typeof v;
  return t === "string" || t === "number" || t === "boolean";
}

function formatScalar(v: string | number | boolean): string {
  return String(v);
}

/** A single leaf value: link, formatted date, or plain text. */
function ScalarValue({ value }: { value: string | number | boolean }) {
  if (typeof value === "string" && LINK_RE.test(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="text-primary underline underline-offset-2 hover:opacity-80"
      >
        {value}
      </a>
    );
  }
  return <span>{formatScalar(value)}</span>;
}

/** Recursively render any frontmatter value. */
function FrontmatterValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (value instanceof Date) {
    return <span>{value.toISOString().slice(0, 10)}</span>;
  }

  if (isScalar(value)) {
    return <ScalarValue value={value} />;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground">—</span>;
    }
    // Scalar arrays render as pills; mixed/object arrays stack vertically.
    if (value.every(isScalar)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, i) => (
            <Badge key={i} variant="secondary" className="font-normal">
              {formatScalar(item as string | number | boolean)}
            </Badge>
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-1">
        {value.map((item, i) => (
          <FrontmatterValue key={i} value={item} />
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <div className="border-l border-border pl-3">
        <FrontmatterEntries data={value as FrontmatterData} />
      </div>
    );
  }

  return <span>{String(value)}</span>;
}

/** Key/value grid for an object's own entries. */
function FrontmatterEntries({ data }: { data: FrontmatterData }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="contents">
          <div className="font-medium text-muted-foreground">{key}</div>
          <div className="min-w-0 break-words text-foreground">
            <FrontmatterValue value={value} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Properties panel rendered above the markdown body. */
export function FrontmatterPanel({ data }: { data: FrontmatterData }) {
  if (Object.keys(data).length === 0) return null;
  return (
    <div className="mb-6 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
      <FrontmatterEntries data={data} />
    </div>
  );
}

export default FrontmatterPanel;
