import { LucideIcon } from "lucide-react";

// Shared "no content" body for a sidebar panel — centered icon + title +
// subtitle. Matches the style first established by the Repo panel's
// "Not a Git Repository" state.
function SidebarEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-4 text-center">
      <Icon className="h-8 w-8 text-icon-faint mb-1" />
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </div>
  );
}

export default SidebarEmptyState;
