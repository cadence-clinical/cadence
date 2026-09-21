import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/**
 * A table of data. Name it with a `TableCaption`, or with `aria-label` or `aria-labelledby`.
 *
 * Its cells wrap between words, and a word is never broken in the middle: a name split across
 * lines can be misread. So a table that is still wider than its place scrolls sideways inside its
 * own box, which takes focus so that a keyboard can scroll it. Given a name, that box is a region
 * a screen reader can move to.
 */
function Table({
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: ComponentProps<"table">) {
  const named = ariaLabel !== undefined || ariaLabelledBy !== undefined;
  return (
    <div
      data-slot="table-container"
      // A box that scrolls must take focus, or a keyboard cannot reach what is out of view.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrolling region is operated from the keyboard, which needs focus
      tabIndex={0}
      role={named ? "region" : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className="relative w-full overflow-x-auto rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <table
        data-slot="table"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        // Digits are all one width, so a column of numbers lines up.
        className={cn("w-full caption-bottom text-body tabular-nums", className)}
        {...props}
      />
    </div>
  );
}

/** The rows of column headings. */
function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />;
}

/** The rows of data. */
function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

/** The rows of totals, at the foot. */
function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  );
}

/**
 * One row. Mark a chosen row with `aria-selected`, and give it a second sign of being chosen,
 * such as a ticked checkbox: the fill alone is colour.
 */
function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        // A row is pointed at all day, so the fill does not fade in.
        "border-b hover:bg-muted/50 aria-selected:bg-muted data-[state=selected]:bg-muted",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A heading cell. It heads a column unless `scope` says otherwise: give the first cell of a row
 * `scope="row"` when it names that row.
 */
function TableHead({ className, scope = "col", ...props }: ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      scope={scope}
      className={cn(
        "h-control px-container-sm text-start align-middle text-control font-medium text-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

/** A data cell. It wraps between words. Align a column of numbers to the end with `text-end`. */
function TableCell({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        // Three quarters of the padding, which makes a row about as high as a control.
        "px-container-sm py-[calc(var(--container-padding-sm)*0.75)] align-middle [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

/** The table's name, shown under it. A screen reader reads it before the table. */
function TableCaption({ className, ...props }: ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-3 text-control text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
