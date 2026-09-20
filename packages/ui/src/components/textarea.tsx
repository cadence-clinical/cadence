import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/** A native `textarea`'s props. */
type TextareaProps = ComponentProps<"textarea">;

/**
 * A multi-line text input. It grows with what is typed, so a long note is never hidden behind a
 * scrollbar, and its first line sits where an Input's text does.
 *
 * It needs an accessible name: a `Label` whose `htmlFor` is this textarea's `id`, or an
 * `aria-label`. Set `aria-invalid` when the value is wrong, and say what is wrong in text.
 */
function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content min-h-[calc(var(--control-height)*2)] w-full min-w-0 resize-y rounded-md border border-input bg-background px-control-x text-control leading-normal text-foreground",
        // The padding that centres one line of text in the height of an Input.
        "py-[calc((var(--control-height)-var(--control-text)*1.5)/2-1px)]",
        // iOS zooms the page when a focused field's text is under 16px, so touch devices get 16px.
        "pointer-coarse:text-base",
        "transition-[border-color,box-shadow] duration-150 ease-out-strong outline-none motion-reduce:transition-none",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
        "aria-invalid:border-critical-border aria-invalid:ring-1 aria-invalid:ring-critical-border",
        // A read-only note is still read, so it keeps full contrast. A disabled one is faded.
        "read-only:bg-muted disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
export type { TextareaProps };
