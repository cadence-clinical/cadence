import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/** A native `label`'s props. */
type LabelProps = ComponentProps<"label">;

/**
 * Names a control. Point `htmlFor` at the control's `id`, or wrap the control in the label.
 *
 * The text follows the density set on <html>, like the control it names, and a long label wraps.
 */
function Label({ className, ...props }: LabelProps) {
  return (
    // The rule cannot see `htmlFor` or the wrapped control, which arrive through the props.
    // eslint-disable-next-line jsx-a11y/label-has-associated-control -- the consumer associates it, and axe checks every story
    <label
      data-slot="label"
      className={cn(
        // leading-snug, not leading-none: the lines of a label that wraps must not collide.
        // A label is a flex container, where words with nowhere to break only wrap if they may
        // break anywhere.
        "flex items-center gap-2 text-control leading-snug font-medium wrap-anywhere select-none",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
export type { LabelProps };
