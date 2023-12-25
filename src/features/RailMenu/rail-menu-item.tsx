export function RailMenuItem({
  desc,
  icon,
  active,
  onClick,
}: {
  desc: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li
      className={`flex flex-col flex-none h-16 w-full items-center justify-center hover:bg-accent hover:text-accent-foreground border-l-4 cursor-pointer ${
        active ? " border-accent" : "  border-transparent "
      }`}
      onClick={onClick}
    >
      {icon}
      <span className="text-xs">{desc}</span>
    </li>
  );
}
