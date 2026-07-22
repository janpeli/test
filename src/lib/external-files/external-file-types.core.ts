// Extensions that should never be opened in the internal editor: they are
// binary formats owned by an external application (Word/Excel/PowerPoint/
// LibreOffice/PDF viewer). Reading them as text would show garbled content
// and risk corrupting the file on save.
export const EXTERNAL_OPEN_EXTENSIONS = [
  "doc",
  "docx",
  "xls",
  "xlsx",
  "xlsm",
  "ppt",
  "pptx",
  "pdf",
  "odt",
  "ods",
  "odp",
] as const;

export function isExternalOpenFile(sufix: string): boolean {
  return EXTERNAL_OPEN_EXTENSIONS.includes(
    sufix.toLowerCase() as (typeof EXTERNAL_OPEN_EXTENSIONS)[number]
  );
}
