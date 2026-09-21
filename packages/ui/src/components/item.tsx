import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { Separator } from "@/components/cadence/separator";
import { cn } from "@/lib/cn";

// Base UI writes each key of `state` as a data attribute, which is how a part gets its `data-slot`
// and the item its `data-size` and `data-variant`.

/** A `div` by default. Pass `render` to make the part another element. */
type ItemPartProps = useRender.ComponentProps<"div">;

/** A part's props, plus `divided`. */
type ItemGroupProps = ItemPartProps & {
  /** Draws a line between items. The lines are borders, so they are valid inside a `ul`. */
  divided?: boolean;
};

/**
 * Holds a set of items. It is a `div` with no list semantics, because it cannot give its items a
 * role. For a list, which a set of items usually is, render it as one:
 * `<ItemGroup render={<ul />}>` with `<Item render={<li />}>` inside.
 */
function ItemGroup({ className, render, divided = false, ...props }: ItemGroupProps) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        className: cn(
          "group/item-group flex w-full flex-col gap-control-gap",
          "data-divided:gap-0 data-divided:[&>[data-slot=item]]:rounded-none data-divided:[&>[data-slot=item]+[data-slot=item]]:border-t-border",
          className,
        ),
      },
      props,
    ),
    state: { slot: "item-group", divided },
  });
}

/**
 * A rule between two sets of items. Not inside a `ul`, which may hold only `li` elements: for a
 * list, set `divided` on the group.
 */
function ItemSeparator({ className, ...props }: ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      className={className}
      {...props}
    />
  );
}

/** The Item's classes, for giving another element the look of an item. */
const itemVariants = cva(
  [
    // It wraps: on a narrow screen the actions drop under the content instead of squeezing it.
    "group/item flex w-full flex-wrap items-center rounded-lg border text-body text-foreground",
    "transition-[background-color,border-color] duration-100 ease-out-strong outline-none motion-reduce:transition-none",
    "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
    // An item that is a link or a button shows that it can be pressed.
    "[a]:hover:bg-muted [button]:text-left [button]:hover:bg-muted",
  ],
  {
    variants: {
      variant: {
        plain: "border-transparent",
        outline: "border-border",
        muted: "border-transparent bg-muted/50",
      },
      // Spacing follows the density set on <html>, and `sm` is one step tighter again.
      size: {
        sm: "gap-(--container-padding-sm) p-(--container-padding-sm)",
        md: "gap-(--container-padding) p-(--container-padding)",
      },
    },
    defaultVariants: { variant: "plain", size: "md" },
  },
);

/** A part's props, plus `variant` and `size`. */
type ItemProps = ItemPartProps & VariantProps<typeof itemVariants>;

/**
 * A row of content: media, a title and a description, and actions. Its title and description
 * wrap and are never cut short, because this is where a medicine's name or a result is shown.
 *
 * Pass `render` to make the whole item a link or a button, or an `li` inside a list.
 */
function Item({ className, variant = "plain", size = "md", render, ...props }: ItemProps) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">({ className: cn(itemVariants({ variant, size }), className) }, props),
    state: { slot: "item", variant, size },
  });
}

/** The ItemMedia's classes. */
const itemMediaVariants = cva(
  [
    "flex shrink-0 items-center justify-center gap-2 [&_svg]:pointer-events-none",
    // Beside a description the media sits with the title, not in the middle of both.
    "group-has-data-[slot=item-description]/item:translate-y-0.5 group-has-data-[slot=item-description]/item:self-start",
  ],
  {
    variants: {
      variant: {
        plain: "bg-transparent",
        icon: "text-muted-foreground [&_svg:not([class*='size-'])]:size-control-icon",
        // The one place an item clips: a picture cropped to a square.
        image:
          "size-control-lg overflow-hidden rounded-sm group-data-[size=sm]/item:size-control [&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: { variant: "plain" },
  },
);

/** A `div`'s props, plus `variant`. */
type ItemMediaProps = ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>;

/** An icon, a picture or anything else that leads the item. */
function ItemMedia({ className, variant = "plain", ...props }: ItemMediaProps) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant }), className)}
      {...props}
    />
  );
}

/** Holds the title and the description. It takes the room the media and actions leave. */
function ItemContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="item-content"
      className={cn(
        // min-w-0 lets long text wrap inside the row instead of pushing the actions out of it.
        "flex min-w-0 flex-1 flex-col gap-0.5 [&+[data-slot=item-content]]:flex-none",
        className,
      )}
      {...props}
    />
  );
}

/** The item's title. It wraps. A badge or an icon can sit beside the text. */
function ItemTitle({ className, render, ...props }: ItemPartProps) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        className: cn(
          "flex max-w-full flex-wrap items-center gap-x-2 gap-y-0.5 leading-snug font-medium wrap-anywhere underline-offset-4",
          className,
        ),
      },
      props,
    ),
    state: { slot: "item-title" },
  });
}

/** Supporting text under the title. It wraps, however long it is. */
function ItemDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        "text-left leading-normal font-normal wrap-anywhere text-muted-foreground group-data-[size=sm]/item:text-control-sm",
        "[&>a]:text-primary-text [&>a]:underline [&>a]:underline-offset-4",
        className,
      )}
      {...props}
    />
  );
}

/** Controls at the end of the item. */
function ItemActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      className={cn("flex items-center gap-control-gap", className)}
      {...props}
    />
  );
}

/** A full-width row above the rest of the item. */
function ItemHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="item-header"
      className={cn("flex basis-full items-center justify-between gap-2", className)}
      {...props}
    />
  );
}

/** A full-width row below the rest of the item. */
function ItemFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="item-footer"
      className={cn("flex basis-full items-center justify-between gap-2", className)}
      {...props}
    />
  );
}

export {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  itemVariants,
};
export type { ItemGroupProps, ItemMediaProps, ItemPartProps, ItemProps };
