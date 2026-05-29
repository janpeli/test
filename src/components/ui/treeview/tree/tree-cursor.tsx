function TreeCursor({ position }: { position: "top" | "bottom" }) {
  return (
    <div
      className={`absolute left-0 right-0 h-0.5 bg-primary z-10 pointer-events-none ${
        position === "top" ? "top-0" : "bottom-0"
      }`}
    />
  );
}

export default TreeCursor;
