import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { Children, type ComponentProps } from "react";

import { cn } from "@/lib/cn";

/** The Timeline's classes, for giving another list the look of a timeline. */
const timelineVariants = cva(
  [
    // The icon's circle, a little larger than a control's icon, so it follows the density.
    "group/timeline flex min-w-0 flex-col gap-container text-body [--timeline-icon:calc(var(--control-icon)*1.5)]",
  ],
  {
    variants: {
      variant: {
        default: "",
        // A rule joins each item's icon to the next one's, so the items read as one sequence.
        connected: "",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

/** An `ol`'s props, plus `variant`. */
type TimelineProps = ComponentProps<"ol"> & VariantProps<typeof timelineVariants>;

/**
 * Things that happened, in order, each with what kind of thing it was, who did it, when, and
 * what: an `ol`, so a screen reader says how many there are. Order the items yourself, newest
 * first for a record's activity. `variant="connected"` joins the items' icons with a rule.
 *
 * Each `TimelineItem` holds a `TimelineIcon`, a `TimelineHeader` with the kind, who and a
 * `TimelineTime`, and a `TimelineContent` with what happened, which can be any content, such as a
 * Comment. The header comes first, so a screen reader hears the kind, who and when before what.
 */
function Timeline({ className, variant = "default", ...props }: TimelineProps) {
  return (
    <ol
      data-slot="timeline"
      data-variant={variant}
      className={cn(timelineVariants({ variant }), className)}
      {...props}
    />
  );
}

/** An `li` by default, with Base UI's `render` to make it another element. */
type TimelineItemProps = useRender.ComponentProps<"li">;

/**
 * One thing that happened. The icon sits in a column of its own, and the header and content beside
 * it. In a connected timeline, a rule runs from its icon to the next item's.
 */
function TimelineItem({ className, render, ...props }: TimelineItemProps) {
  return useRender({
    defaultTagName: "li",
    render,
    props: mergeProps<"li">(
      {
        className: cn(
          "group/timeline-item relative grid min-w-0 grid-cols-[minmax(0,1fr)] gap-x-2.5 gap-y-0.5",
          "has-[>[data-slot=timeline-icon]]:grid-cols-[auto_minmax(0,1fr)]",
          // The rule, from under this icon to the top of the next one, across the gap between.
          "group-data-[variant=connected]/timeline:not-last:has-[>[data-slot=timeline-icon]]:before:absolute",
          "before:top-[calc(var(--timeline-icon)+0.25rem)] before:bottom-[calc(0.25rem-var(--container-padding))] before:left-[calc(var(--timeline-icon)/2-0.5px)] before:w-px before:bg-border",
          "before:hidden group-data-[variant=connected]/timeline:not-last:has-[>[data-slot=timeline-icon]]:before:block",
          className,
        ),
      },
      props,
    ),
    state: { slot: "timeline-item" },
  });
}

/**
 * The item's icon, in a circle: the kind of thing that happened, such as a speech bubble for a
 * comment. It is hidden from a screen reader, so say the kind in words in the `TimelineHeader`.
 * Pass a `lucide-react` icon as its child, with no size class.
 */
function TimelineIcon({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="timeline-icon"
      aria-hidden
      className={cn(
        "col-start-1 row-[1/span_2] flex size-(--timeline-icon) shrink-0 items-center justify-center self-start rounded-full border border-border bg-background text-muted-foreground",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[calc(var(--control-icon)*0.875)]",
        className,
      )}
      {...props}
    />
  );
}

/**
 * What kind of thing happened, who and when, on one line that wraps, with a middle dot between the
 * parts. A dot wraps with the part after it, so no line ends on one. The dots are hidden from a
 * screen reader, which pauses between the parts instead. Its first line is centred on the icon.
 */
function TimelineHeader({ className, children, ...props }: ComponentProps<"div">) {
  const parts = Children.toArray(children);
  return (
    <div
      data-slot="timeline-header"
      className={cn(
        "col-[-2/-1] row-start-1 flex min-w-0 flex-wrap items-baseline gap-x-1.5 leading-snug text-muted-foreground",
        "group-has-[>[data-slot=timeline-icon]]/timeline-item:pt-[calc((var(--timeline-icon)-1lh)/2)]",
        className,
      )}
      {...props}
    >
      {parts.map((part, index) =>
        index === 0 ? (
          part
        ) : (
          // The dot goes with the part after it, so a line never ends on a dot.
          <span
            key={`part-${String(index)}`}
            className="inline-flex min-w-0 items-baseline gap-x-1.5"
          >
            <span aria-hidden>·</span>
            {part}
          </span>
        ),
      )}
    </div>
  );
}

/** A `span` by default, with Base UI's `render` to make it another element. */
type TimelineTitleProps = useRender.ComponentProps<"span">;

/** The kind of thing that happened, such as "Comment" or "Result", in the text's colour. */
function TimelineTitle({ className, render, ...props }: TimelineTitleProps) {
  return useRender({
    defaultTagName: "span",
    render,
    props: mergeProps<"span">(
      { className: cn("font-medium whitespace-nowrap text-foreground", className) },
      props,
    ),
    state: { slot: "timeline-title" },
  });
}

/**
 * When it happened, as words you format, such as "Mon 19 Oct, 06:00": a `time` element. Give
 * `dateTime` the moment in ISO 8601 with its offset. Cadence never reads the clock.
 */
function TimelineTime({ className, ...props }: ComponentProps<"time">) {
  return (
    <time
      data-slot="timeline-time"
      className={cn("whitespace-nowrap tabular-nums", className)}
      {...props}
    />
  );
}

/**
 * What happened: text, or any content, such as a Comment or a list of results. It wraps, and is
 * never cut short. It comes after the header, so a screen reader hears it last.
 */
function TimelineContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="timeline-content"
      className={cn("col-[-2/-1] min-w-0 wrap-break-word", className)}
      {...props}
    />
  );
}

export {
  Timeline,
  TimelineContent,
  TimelineHeader,
  TimelineIcon,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
  timelineVariants,
};
export type { TimelineItemProps, TimelineProps, TimelineTitleProps };
