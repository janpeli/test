import { File, FileText, Workflow, Database } from "lucide-react";
import type { Plugin } from "electron/src/project";

const LUCIDE_CLASS = "w-4 h-4 text-base pointer-events-none flex-shrink-0";

function getBaseObjectIcon(
  plugins: Plugin[],
  plugin_uuid: string | null,
  sufix: string
): string | null {
  if (!plugin_uuid) return null;
  const plugin = plugins.find((p) => p.uuid === plugin_uuid);
  const obj = plugin?.base_objects.find((o) => o.sufix === sufix);
  return obj?.icon || null;
}

export function FileIcon({
  name,
  sufix,
  plugin_uuid,
  plugins,
}: {
  name: string;
  sufix: string;
  plugin_uuid: string | null;
  plugins: Plugin[];
}) {
  // Canvas files are named "*.can.md", so their sufix is "md" — detect them by
  // name (mirrors editor-api.ts) before the markdown check below.
  if (name.toLowerCase().endsWith(".can")) {
    return <Workflow className={LUCIDE_CLASS} />;
  }
  const dataUrl = getBaseObjectIcon(plugins, plugin_uuid, sufix);
  if (dataUrl) {
    if (dataUrl.startsWith("data:image/svg+xml;base64,")) {
      const svgString = atob(dataUrl.slice("data:image/svg+xml;base64,".length));
      return (
        <span
          className="w-4 h-4 flex-shrink-0 pointer-events-none [&>svg]:w-full [&>svg]:h-full"
          dangerouslySetInnerHTML={{ __html: svgString }}
        />
      );
    }
    return <img src={dataUrl} className="w-4 h-4 flex-shrink-0 pointer-events-none dark:invert" />;
  }
  if (sufix === "md" || sufix === "markdown") {
    return <FileText className={LUCIDE_CLASS} />;
  }
  if (sufix === "mdl") {
    return <Database className={LUCIDE_CLASS} />;
  }
  return <File className={LUCIDE_CLASS} />;
}
