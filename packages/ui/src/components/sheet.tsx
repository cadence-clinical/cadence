import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/cadence/button";
import { DialogOverlay } from "@/components/cadence/dialog";
import { cn } from "@/lib/cn";

/**
 * A panel from an edge of the screen, for a task beside the page rather than over it, such as a
 * record's details or a list's filters. It holds focus until it is closed. Give it a `SheetTitle`:
 * that is its name.
 */
function Sheet(props: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

/** Opens the sheet. Render it as a `Button` through `render`. */
function SheetTrigger(props: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

/** Closes the sheet. Render it as a `Button` through `render`. */
function SheetClose(props: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

/** Where the sheet is rendered: at the end of `body`, unless it is given a `container`. */
function SheetPortal(props: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

/** The scrim over the page, the same as a Dialog's. */
function SheetOverlay(props: SheetPrimitive.Backdrop.Props) {
  return <DialogOverlay data-slot="sheet-overlay" {...props} />;
}

/** The Base UI Dialog Popup's props, plus `side` and `showCloseButton`. */
type SheetContentProps = SheetPrimitive.Popup.Props & {
  /** The edge it comes from. */
  side?: "top" | "right" | "bottom" | "left";
  /** A close button in the corner. Leave it on unless the footer has its own way out. */
  showCloseButton?: boolean;
};

/**
 * The sheet itself, with its scrim. It slides in from its edge in 200ms, and appears without
 * moving when the user asks for reduced motion. What does not fit scrolls inside it, so its last
 * button can always be reached.
 */
function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          // The controls inside fill with the sheet's colour, not the page's, as in a dialog.
          "[--background:var(--popover)]",
          "fixed z-50 flex flex-col gap-container overflow-y-auto overscroll-contain bg-popover text-body text-popover-foreground shadow-lg outline-none",
          "data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:sm:max-w-sm",
          "data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:sm:max-w-sm",
          "data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:max-h-[calc(100dvh-2rem)] data-[side=top]:border-b data-[side=top]:pt-[env(safe-area-inset-top)]",
          "data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:max-h-[calc(100dvh-2rem)] data-[side=bottom]:border-t data-[side=bottom]:pb-[env(safe-area-inset-bottom)]",
          // It slides in from its edge, as the Sidebar's sheet does. Tailwind sets `translate`
          // as its own property.
          "transition-[translate] duration-200 ease-out-strong data-ending-style:duration-150 motion-reduce:transition-none",
          "data-[side=left]:data-ending-style:-translate-x-full data-[side=left]:data-starting-style:-translate-x-full",
          "data-[side=right]:data-ending-style:translate-x-full data-[side=right]:data-starting-style:translate-x-full",
          "data-[side=top]:data-ending-style:-translate-y-full data-[side=top]:data-starting-style:-translate-y-full",
          "data-[side=bottom]:data-ending-style:translate-y-full data-[side=bottom]:data-starting-style:translate-y-full",
          // The title stops short of the close button and never runs under it.
          "has-[>[data-slot=sheet-close]]:*:data-[slot=sheet-header]:pr-[calc(var(--container-padding)+var(--control-height-sm))]",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button variant="ghost" size="sm" iconOnly className="absolute top-2 right-2" />
            }
          >
            <X aria-hidden />
            Close
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

/** The title and description, at the top. */
function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1 p-container", className)}
      {...props}
    />
  );
}

/** The sheet's buttons, at the foot, stacked at full width with the main one first. */
function SheetFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-container", className)}
      {...props}
    />
  );
}

/** The sheet's name. It wraps, and its lines do not collide. */
function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "text-title leading-snug font-medium wrap-break-word text-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** What the sheet is for. A screen reader reads it after the title. */
function SheetDescription({ className, ...props }: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn(
        "text-body wrap-break-word text-muted-foreground *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
export type { SheetContentProps };
