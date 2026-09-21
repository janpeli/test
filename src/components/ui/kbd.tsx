import * as React from "react"
import { cn } from "@/lib/utils"

function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex min-w-[2em] items-center justify-center rounded-md border border-border bg-muted px-2 py-1 font-mono text-sm font-medium text-muted-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
}

export { Kbd }
