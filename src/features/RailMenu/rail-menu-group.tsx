export function RailMenuGroup({ children }: { children: React.ReactNode }) {
  return (
    <ul className="flex flex-col justify-center items-center w-full">
      {children}
    </ul>
  );
}
