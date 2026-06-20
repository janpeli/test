/**
 * Thin form-body wrapper. The section tab bar that used to live here is now
 * rendered by {@link EditorFormSectionNav} as a fixed header above the form's
 * scroll container (see `editor-form-panels.tsx`), so it can't scroll away.
 */
export function EditorFormLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col bg-primary-foreground min-w-min">
      <div className="flex-1 p-1">{children}</div>
    </div>
  );
}
