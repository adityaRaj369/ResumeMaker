import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & { variant?: "default" | "outline" | "accent" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        variant === "default" && "bg-muted text-foreground",
        variant === "outline" && "border border-border text-muted-foreground",
        variant === "accent" && "bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
        className,
      )}
      {...props}
    />
  );
}
