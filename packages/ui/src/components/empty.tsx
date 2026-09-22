import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/**
 * What a list or a panel shows when it has nothing in it: what is empty, and what to do next.
 * Say what is empty, not what that means. "No allergies recorded" says the list is empty. It does
 * not say the person has none.
 */
function Empty({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-container rounded-xl border-dashed p-[calc(var(--container-padding)*2)] text-center text-balance",
        className,
      )}
      {...props}
    />
  );
}

/** The media, title and description, centred above any actions. */
function EmptyHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex max-w-sm flex-col items-center gap-2", className)}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "size-control rounded-lg bg-muted text-foreground [&_svg:not([class*='size-'])]:size-control-icon",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

/** A `div`'s props, plus `variant`. */
type EmptyMediaProps = ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>;

/** An icon or a picture above the title. `icon` sets an icon on a small tile. */
function EmptyMedia({ className, variant = "default", ...props }: EmptyMediaProps) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant }), className)}
      {...props}
    />
  );
}

/** A `div`'s props, plus Base UI's `render`. */
type EmptyTitleProps = useRender.ComponentProps<"div">;

/** What is empty, in a few words. Render it as a heading where the panel has one. */
function EmptyTitle({ className, render, ...props }: EmptyTitleProps) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      { className: cn("text-title font-medium tracking-tight", className) },
      props,
    ),
    state: { slot: "empty-title" },
  });
}

/** What to do next, or why it is empty. A link in it is underlined. */
function EmptyDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "text-body/relaxed text-muted-foreground",
        "[&>a]:rounded-xs [&>a]:underline [&>a]:underline-offset-4 [&>a]:outline-none [&>a:hover]:text-foreground",
        "[&>a]:focus-visible:ring-2 [&>a]:focus-visible:ring-ring [&>a]:focus-visible:ring-offset-2 [&>a]:focus-visible:ring-offset-background",
        className,
      )}
      {...props}
    />
  );
}

/** The actions: a button or two, or a search to try again. */
function EmptyContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-2.5 text-body text-balance",
        className,
      )}
      {...props}
    />
  );
}

export {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  emptyMediaVariants,
};
export type { EmptyMediaProps, EmptyTitleProps };
