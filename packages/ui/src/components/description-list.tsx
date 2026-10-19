import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/**
 * How the terms sit beside their details: `responsive` side by side while the list is 18rem wide
 * or more and stacked below that, `horizontal` always side by side, `vertical` always stacked.
 */
type DescriptionListOrientation = "responsive" | "horizontal" | "vertical";

/** A `dl`'s props, plus `orientation`. */
type DescriptionListProps = ComponentProps<"dl"> & {
  /** Side by side, stacked, or side by side only where there is room. Defaults to `responsive`. */
  orientation?: DescriptionListOrientation;
};

/**
 * Pairs of a term and its details, such as "Working problem" and "Community-acquired pneumonia":
 * a `dl`. Put each pair in a `DescriptionItem`, with a `DescriptionTerm` and one or more
 * `DescriptionDetails`.
 *
 * The terms take a column as wide as the widest of them, up to 40% of the list, and wrap beyond
 * it. With `orientation="responsive"`, the default, the list measures its own width and stacks
 * each term over its details below 18rem, so it fills the block it is in. In a box that shrinks to
 * fit its content, such as a popover, give the list a width.
 */
function DescriptionList({
  className,
  orientation = "responsive",
  ...props
}: DescriptionListProps) {
  return (
    <dl
      data-slot="description-list"
      data-orientation={orientation}
      className={cn(
        "group/description-list @container/description-list grid grid-cols-[fit-content(40%)_minmax(0,1fr)] gap-x-container gap-y-1.5 text-body",
        className,
      )}
      {...props}
    />
  );
}

/**
 * One term and its details. A `div`, which a `dl` allows around each pair, and which keeps the
 * pair together when it stacks. It spans the list and shares its columns, so every term lines up.
 */
function DescriptionItem({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="description-item"
      className={cn("col-span-full grid grid-cols-subgrid gap-y-0.5", className)}
      {...props}
    />
  );
}

// Where a term and its details sit: across both columns when stacked, in their own column side by
// side. The list is the container the responsive layout measures.
const SIDE_BY_SIDE_TERM = cn(
  "group-data-[orientation=horizontal]/description-list:col-span-1 group-data-[orientation=horizontal]/description-list:col-start-1",
  "@2xs/description-list:group-data-[orientation=responsive]/description-list:col-span-1 @2xs/description-list:group-data-[orientation=responsive]/description-list:col-start-1",
);
const SIDE_BY_SIDE_DETAILS = cn(
  "group-data-[orientation=horizontal]/description-list:col-span-1 group-data-[orientation=horizontal]/description-list:col-start-2",
  "@2xs/description-list:group-data-[orientation=responsive]/description-list:col-span-1 @2xs/description-list:group-data-[orientation=responsive]/description-list:col-start-2",
);

/** The term: what the details describe, in muted text. It wraps, and is never cut short. */
function DescriptionTerm({ className, ...props }: ComponentProps<"dt">) {
  return (
    <dt
      data-slot="description-term"
      className={cn(
        "col-span-full min-w-0 wrap-break-word text-muted-foreground",
        SIDE_BY_SIDE_TERM,
        className,
      )}
      {...props}
    />
  );
}

/**
 * The details of a term: text, or any content, such as badges or a list. They wrap, and are never
 * cut short. A term can have more than one.
 */
function DescriptionDetails({ className, ...props }: ComponentProps<"dd">) {
  return (
    <dd
      data-slot="description-details"
      className={cn(
        "col-span-full min-w-0 wrap-break-word text-foreground",
        SIDE_BY_SIDE_DETAILS,
        className,
      )}
      {...props}
    />
  );
}

export { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm };
export type { DescriptionListOrientation, DescriptionListProps };
