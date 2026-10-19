import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/** The Base UI Avatar Root's props, plus its size. */
type AvatarProps = AvatarPrimitive.Root.Props & {
  /** Each size follows the density: `default` is a control's height, `sm` and `lg` its others. */
  size?: "default" | "sm" | "lg";
};

/**
 * A person's picture, or their initials when there is no picture or it does not load. Always give
 * it an `AvatarFallback`.
 *
 * Beside the person's name, it says nothing the name does not, so hide it from screen readers with
 * `aria-hidden`.
 */
function Avatar({ className, size = "default", ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar relative flex size-control shrink-0 rounded-full select-none data-[size=lg]:size-control-lg data-[size=sm]:size-control-sm",
        // A faint edge, so a picture with a light background does not merge into the page.
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:border after:border-foreground/10",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The picture. It shows once it has loaded, and the fallback shows until then. Give it `alt`, or
 * an empty `alt` where the person's name is beside it.
 */
function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full rounded-full object-cover", className)}
      {...props}
    />
  );
}

/**
 * What shows when there is no picture: usually the person's initials, as they write them. Its text
 * follows the avatar's size and the density.
 */
function AvatarFallback({ className, ...props }: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-control font-medium text-muted-foreground",
        "group-data-[size=lg]/avatar:text-control-lg group-data-[size=sm]/avatar:text-control-sm",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A dot on the avatar's lower edge. A dot is colour alone, so if it means something, say it in
 * words inside it with `sr-only`, and show it another way too.
 */
function AvatarBadge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background select-none",
        "size-[calc(var(--control-height)/3)] [&>svg]:size-3/4",
        "group-data-[size=lg]/avatar:size-[calc(var(--control-height-lg)/3)]",
        "group-data-[size=sm]/avatar:size-[calc(var(--control-height-sm)/3)] group-data-[size=sm]/avatar:[&>svg]:hidden",
        className,
      )}
      {...props}
    />
  );
}

/** A row of avatars that overlap, such as the people in a team. Give it a name, as a list. */
function AvatarGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex *:not-first:-ml-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className,
      )}
      {...props}
    />
  );
}

/** The count at the end of an `AvatarGroup`, of the people it does not show. Say what it counts. */
function AvatarGroupCount({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-control shrink-0 items-center justify-center rounded-full bg-muted text-control-sm font-medium text-muted-foreground tabular-nums ring-2 ring-background",
        "group-has-data-[size=lg]/avatar-group:size-control-lg group-has-data-[size=sm]/avatar-group:size-control-sm",
        "[&>svg]:size-control-icon",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage };
export type { AvatarProps };
