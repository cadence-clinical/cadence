import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ChevronRight, Ellipsis } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/** A `nav`'s props. */
type BreadcrumbProps = ComponentProps<"nav">;

/**
 * The trail of pages above the one shown, from the top of the application down. It is a `nav`
 * landmark named "Breadcrumb". Give it another name with `aria-label`.
 */
function Breadcrumb({ className, ...props }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      data-slot="breadcrumb"
      className={cn("min-w-0", className)}
      {...props}
    />
  );
}

/**
 * The ordered list of the trail. When the trail is wider than its room it wraps onto another
 * line. It never cuts a page's name short.
 */
function BreadcrumbList({ className, ...props }: ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "flex flex-wrap items-center gap-x-1.5 text-control wrap-break-word text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** One page in the trail, holding a `BreadcrumbLink`, a `BreadcrumbPage` or an ellipsis. */
function BreadcrumbItem({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex min-w-0 items-center gap-1", className)}
      {...props}
    />
  );
}

/** An `a`'s props with Base UI's `render`, to render a router's link instead. */
type BreadcrumbLinkProps = useRender.ComponentProps<"a">;

/**
 * A link to a page above the one shown. It is as tall as a control, so it is a 32px target when
 * compact and a 44px one when comfortable. Pass a router's link to `render`.
 */
function BreadcrumbLink({ className, render, ...props }: BreadcrumbLinkProps) {
  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(
      {
        className: cn(
          "inline-flex min-h-control items-center rounded-sm underline-offset-4 outline-none",
          "transition-colors duration-150 hover:text-foreground hover:underline motion-reduce:transition-none",
          "focus-visible:ring-2 focus-visible:ring-ring",
          className,
        ),
      },
      props,
    ),
    state: { slot: "breadcrumb-link" },
  });
}

/**
 * The page shown, at the end of the trail. It is not a link, and it carries `aria-current="page"`,
 * which a screen reader announces.
 */
function BreadcrumbPage({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      className={cn(
        "inline-flex min-h-control items-center font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The mark between two pages: a chevron, unless you give it children. It is hidden from screen
 * readers, which announce the list's structure instead.
 */
function BreadcrumbSeparator({ children, className, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden
      className={cn(
        "inline-flex items-center [&>svg]:size-[calc(var(--control-icon)-0.125rem)] [&>svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

/**
 * Stands in for pages left out of a long trail. Its children are its name, which is hidden from
 * sight: "More" unless you give it other words. Put it in a `DropdownMenuTrigger` that lists the
 * pages it stands for, so they can still be reached.
 */
function BreadcrumbEllipsis({ className, children, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      className={cn(
        "flex size-control items-center justify-center [&>svg]:size-control-icon [&>svg]:shrink-0",
        className,
      )}
      {...props}
    >
      <Ellipsis aria-hidden />
      <span className="sr-only">{children ?? "More"}</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
export type { BreadcrumbLinkProps, BreadcrumbProps };
