import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

/** The Badge's classes, for giving another element the look of a badge. */
const badgeVariants = cva(
  [
    // A minimum height, no clipping and no nowrap: a badge that holds clinical text wraps.
    "inline-flex min-h-5 w-fit max-w-full shrink-0 items-center justify-center gap-1 rounded-md border px-1.5 py-0.5",
    // anywhere, not break-word: inside a flex box only anywhere lets a long unbroken value shrink.
    "text-control-sm leading-tight font-medium wrap-anywhere tabular-nums",
    "[&>svg]:pointer-events-none [&>svg]:size-[calc(var(--control-icon)-0.25rem)] [&>svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        primary: "border-transparent bg-primary text-primary-foreground",
        outline: "border-input text-foreground",
        // A status surface: its tinted fill, its text and the border that gives it an edge. The
        // consumer chooses the status. A badge never works one out.
        critical: "border-critical-border bg-critical-subtle text-critical-text",
        warning: "border-warning-border bg-warning-subtle text-warning-text",
        success: "border-success-border bg-success-subtle text-success-text",
        info: "border-info-border bg-info-subtle text-info-text",
      },
    },
    defaultVariants: { variant: "secondary" },
  },
);

/** A `span`'s props with Base UI's `render`, plus `variant`. */
type BadgeProps = useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

/**
 * A short label or count beside something else. A status variant shows a status it is given, and
 * its text has to say what the status is: colour alone is not read by everyone.
 */
function Badge({ className, variant = "secondary", render, ...props }: BadgeProps) {
  return useRender({
    defaultTagName: "span",
    render,
    props: mergeProps<"span">({ className: cn(badgeVariants({ variant }), className) }, props),
    state: { slot: "badge", variant },
  });
}

export { Badge, badgeVariants };
export type { BadgeProps };
