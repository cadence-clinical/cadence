import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/** A `div`'s props. */
type SkeletonProps = ComponentProps<"div">;

/**
 * Holds the place of content that is loading, in the shape it will take, so the page does not
 * jump when the content arrives. Size it with the density scale where it stands in for a control.
 *
 * It is the text colour at 10%, so it shows on the page, on a card and on a muted surface in every
 * brand and mode. It pulses, which is a fade, so it still pulses when the user asks for reduced
 * motion.
 *
 * It is hidden from assistive technology. Mark the region that is loading `aria-busy`, and say in
 * words what is loading.
 */
function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("animate-pulse rounded-md bg-foreground/10", className)}
      {...props}
    />
  );
}

export { Skeleton };
export type { SkeletonProps };
