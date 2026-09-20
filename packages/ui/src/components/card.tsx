import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";

import { cn } from "@/lib/cn";

// Base UI writes each key of `state` as a data attribute, which is how every part gets its
// `data-slot` and the card its `data-size`.

/** A `div` by default. Pass `render` to make the part another element, such as a heading. */
type CardPartProps = useRender.ComponentProps<"div">;

/** The Card's props: a part's props, plus `size`. */
type CardProps = CardPartProps & {
  /** `sm` tightens the spacing and the title, for a card inside a dense layout. */
  size?: "sm" | "md";
};

/**
 * Groups related content on its own surface. Its text and spacing follow the density set on <html>.
 * It does not clip its content, so a focus ring at its
 * edge stays whole, and its text wraps: nothing in a card is truncated.
 *
 * Pass `render` to give it meaning, for example `render={<section aria-labelledby={id} />}`.
 */
function Card({ className, render, size = "md", ...props }: CardProps) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        className: cn(
          "group/card flex flex-col gap-(--card-spacing) rounded-lg border bg-card py-(--card-spacing) text-body wrap-break-word text-card-foreground",
          // Spacing and text follow the density set on <html>, like the controls inside the card.
          "[--card-spacing:var(--container-padding)] data-[size=sm]:[--card-spacing:var(--container-padding-sm)]",
          "has-data-[slot=card-footer]:pb-0",
          className,
        ),
      },
      props,
    ),
    state: { slot: "card", size },
  });
}

/** Holds the title, the description and an optional action. */
function CardHeader({ className, render, ...props }: CardPartProps) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        className: cn(
          // minmax(0, 1fr) lets a long title wrap instead of pushing the action out of the card.
          "grid auto-rows-min grid-cols-[minmax(0,1fr)] items-start gap-1 px-(--card-spacing)",
          "has-data-[slot=card-action]:grid-cols-[minmax(0,1fr)_auto] [.border-b]:pb-(--card-spacing)",
          className,
        ),
      },
      props,
    ),
    state: { slot: "card-header" },
  });
}

/**
 * The card's title. It is a `div` unless you say otherwise, because only the page knows which
 * heading level fits: pass `render={<h2 />}` so screen reader users can find the card by heading.
 */
function CardTitle({ className, render, ...props }: CardPartProps) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        className: cn("text-title font-medium group-data-[size=sm]/card:text-body", className),
      },
      props,
    ),
    state: { slot: "card-title" },
  });
}

/** Supporting text under the title. */
function CardDescription({ className, render, ...props }: CardPartProps) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      { className: cn("text-body text-muted-foreground", className) },
      props,
    ),
    state: { slot: "card-description" },
  });
}

/** A control at the top end of the header, beside the title. */
function CardAction({ className, render, ...props }: CardPartProps) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        className: cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className),
      },
      props,
    ),
    state: { slot: "card-action" },
  });
}

/** The body of the card. */
function CardContent({ className, render, ...props }: CardPartProps) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">({ className: cn("px-(--card-spacing)", className) }, props),
    state: { slot: "card-content" },
  });
}

/** Actions for the whole card. They wrap when they do not fit on one line. */
function CardFooter({ className, render, ...props }: CardPartProps) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        className: cn(
          // One pixel less than the card's radius, so the fill follows the inside of the border.
          "flex flex-wrap items-center gap-2 rounded-b-[calc(var(--radius-lg)-1px)] border-t bg-muted/50 p-(--card-spacing)",
          className,
        ),
      },
      props,
    ),
    state: { slot: "card-footer" },
  });
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
export type { CardPartProps, CardProps };
