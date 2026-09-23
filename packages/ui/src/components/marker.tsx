import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/** The Marker's classes, for giving another element the look of a marker. */
const markerVariants = cva(
  [
    "group/marker relative flex w-full items-center gap-2 text-left text-body text-muted-foreground",
    "[&_svg:not([class*='size-'])]:size-control-icon",
    // Rendered as a link, the whole marker is the link.
    "[a]:rounded-xs [a]:underline [a]:underline-offset-3 [a]:outline-none [a]:hover:text-foreground",
    "[a]:focus-visible:ring-2 [a]:focus-visible:ring-ring [a]:focus-visible:ring-offset-2 [a]:focus-visible:ring-offset-background",
  ],
  {
    variants: {
      variant: {
        default: "",
        // Each rule keeps a little length, so a long label wraps between them rather than
        // pushing them out of sight.
        separator: [
          "before:mr-1 before:h-px before:min-w-4 before:flex-1 before:bg-border",
          "after:ml-1 after:h-px after:min-w-4 after:flex-1 after:bg-border",
        ],
        border: "border-b border-border pb-container-sm",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

/** A `div`'s props, plus `variant` and Base UI's `render`. */
type MarkerProps = useRender.ComponentProps<"div"> & VariantProps<typeof markerVariants>;

/**
 * A line of muted text, with an optional icon, that marks a place in a list or a page, such as
 * the day above a day's entries. `separator` draws a rule on each side of it, and `border` a rule
 * under it.
 *
 * It is a `div`. Where it heads what follows, render it as a heading, and in a list, as an `li`.
 */
function Marker({ className, variant = "default", render, ...props }: MarkerProps) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">({ className: cn(markerVariants({ variant }), className) }, props),
    // Base UI writes each key of `state` as a data attribute, which is how the marker gets its
    // `data-slot` and `data-variant`.
    state: { slot: "marker", variant },
  });
}

/** The marker's icon. It is hidden from assistive technology: the words carry the meaning. */
function MarkerIcon({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="marker-icon"
      aria-hidden
      className={cn("flex shrink-0 [&_svg:not([class*='size-'])]:size-control-icon", className)}
      {...props}
    />
  );
}

/** The marker's words. They wrap, and between two rules they are centred. */
function MarkerContent({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="marker-content"
      className={cn(
        "min-w-0 wrap-break-word",
        "group-data-[variant=separator]/marker:flex-initial group-data-[variant=separator]/marker:text-center",
        "*:[a]:rounded-xs *:[a]:underline *:[a]:underline-offset-3 *:[a]:outline-none *:[a]:hover:text-foreground",
        "*:[a]:focus-visible:ring-2 *:[a]:focus-visible:ring-ring *:[a]:focus-visible:ring-offset-2 *:[a]:focus-visible:ring-offset-background",
        className,
      )}
      {...props}
    />
  );
}

export { Marker, MarkerContent, MarkerIcon, markerVariants };
export type { MarkerProps };
