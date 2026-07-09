import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" | "outline" | "danger" | "success" }) {
  const styles = {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    outline: "text-foreground",
    danger: "border-red-400/40 bg-red-500/15 text-red-200",
    success: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  };
  return <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", styles[variant], className)} {...props} />;
}
