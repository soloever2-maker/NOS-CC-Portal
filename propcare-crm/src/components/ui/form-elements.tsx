import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
//  TEXTAREA
// ─────────────────────────────────────────────

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-[8px] px-3 py-2 text-sm",
            "bg-[var(--black-700)] border border-[var(--black-500)] text-[var(--text-primary)]",
            "placeholder:text-[var(--text-muted)]",
            "focus-visible:outline-none focus-visible:border-[var(--gold-500)] focus-visible:ring-1 focus-visible:ring-[var(--gold-glow)]",
            "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
            error && "border-[var(--danger)]",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// ─────────────────────────────────────────────
//  LABEL
// ─────────────────────────────────────────────

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-xs font-medium text-[var(--text-secondary)] leading-none",
      "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

// ─────────────────────────────────────────────
//  SEPARATOR
// ─────────────────────────────────────────────

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      "shrink-0 bg-[var(--border)]",
      orientation === "horizontal" ? "h-[0.5px] w-full" : "h-full w-[0.5px]",
      className
    )}
    {...props}
  />
));
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Textarea, Label, Separator };
