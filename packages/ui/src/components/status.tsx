import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

/** The Status's classes, for giving another element the look of a status. */
const statusVariants = cva(
  [
    // No surface: an icon and a word, inline, so several fit in a table cell on one line.
    "inline-flex w-fit max-w-full items-center gap-1 align-middle leading-snug",
    // The words take the colour around them, which holds its contrast on any row or surface. The
    // icon takes the status's text colour, held at 3:1 or more against the page and a card.
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[calc(var(--control-icon)*0.875)]",
  ],
  {
    variants: {
      tone: {
        neutral: "[&_svg]:text-muted-foreground",
        info: "[&_svg]:text-info-text",
        success: "[&_svg]:text-success-text",
        warning: "[&_svg]:text-warning-text",
        critical: "[&_svg]:text-critical-text",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

/** One of the fixed status colours, or `neutral` for a state that is not a status. */
type StatusTone = NonNullable<VariantProps<typeof statusVariants>["tone"]>;

/** A `span`'s props with Base UI's `render`, plus `tone`. */
type StatusProps = useRender.ComponentProps<"span"> & VariantProps<typeof statusVariants>;

/**
 * A state shown as an icon and a word, such as "Referred" or "Cleared", with no surface around it.
 * `tone` colours the icon with one of the fixed status colours, and the words say what the state
 * is, so it is never shown by colour alone. Pass the icon as a child with
 * `data-icon="inline-start"`, and the words beside it.
 *
 * Status shows a state it is given. It never works one out.
 */
function Status({ className, tone = "neutral", render, ...props }: StatusProps) {
  return useRender({
    defaultTagName: "span",
    render,
    props: mergeProps<"span">({ className: cn(statusVariants({ tone }), className) }, props),
    state: { slot: "status", tone },
  });
}

export { Status, statusVariants };
export type { StatusProps, StatusTone };
