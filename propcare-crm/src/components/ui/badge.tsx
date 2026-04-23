import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors border",
  {
    variants: {
      variant: {
        default: "bg-[var(--gold-glow)] text-[var(--gold-400)] border-[var(--border)]",
        open: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        "in-progress": "bg-amber-500/15 text-amber-400 border-amber-500/30",
        resolved: "bg-green-500/15 text-green-400 border-green-500/30",
        closed: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
        urgent: "bg-red-500/15 text-red-400 border-red-500/30",
        high: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        medium: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        low: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
        won: "bg-green-500/15 text-green-400 border-green-500/30",
        lost: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
        new: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        gold: "bg-[var(--gold-glow)] text-[var(--gold-400)] border-[var(--border-strong)]",
        destructive: "bg-red-500/15 text-red-400 border-red-500/30",
        outline: "border-[var(--border)] text-[var(--text-secondary)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
