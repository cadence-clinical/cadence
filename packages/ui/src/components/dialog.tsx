import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/cadence/button";
import { cn } from "@/lib/cn";

/**
 * A window over the page for one task, which holds focus until it is closed. Give it a
 * `DialogTitle`: that is its name.
 *
 * Escape and a press outside close it. Where that would lose work, or for a choice that must be
 * made, set `disablePointerDismissal`.
 */
const Dialog = DialogPrimitive.Root;

/** Opens the dialog. Render it as a `Button` through `render`. */
function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

/** Where the dialog is rendered: at the end of `body`, unless it is given a `container`. */
const DialogPortal = DialogPrimitive.Portal;

/** Closes the dialog. Render it as a `Button` through `render`. */
function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

/**
 * The scrim over the page. It darkens the page in both modes, enough that the page reads as out
 * of reach, and it does not blur: blur is slow in Safari and the scrim is doing the work.
 */
function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-overlay",
        "transition-opacity duration-150 ease-out-strong data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

/** The Base UI Dialog Popup's props, plus `showCloseButton`. */
type DialogContentProps = DialogPrimitive.Popup.Props & {
  /** A close button in the corner. Leave it on unless the footer has its own way out. */
  showCloseButton?: boolean;
};

/**
 * The dialog itself, with its scrim. It is never taller than the screen: what does not fit
 * scrolls inside it, so its last button can always be reached.
 *
 * It opens with a short fade and a slight growth from its centre, and closes faster than it opens.
 * A dialog is opened now and then, not all day, so the motion is kept. Reduced motion keeps the
 * fade and drops the growth.
 */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "[--dialog-spacing:calc(var(--container-padding)+0.25rem)]",
          // The controls inside fill with the dialog's colour, not the page's, as in a card.
          "[--background:var(--popover)]",
          // One column that may shrink: a grid's own column grows to its longest word.
          "fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 grid-cols-[minmax(0,1fr)] gap-(--dialog-spacing) overflow-y-auto rounded-lg border bg-popover p-(--dialog-spacing) text-body text-popover-foreground shadow-lg outline-none sm:max-w-sm",
          // Tailwind sets `scale` as its own property, so that is the property that transitions.
          "transition-[opacity,scale] duration-150 ease-out-strong data-ending-style:duration-100",
          "data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-starting-style:scale-[0.97] data-starting-style:opacity-0",
          "motion-reduce:transition-[opacity] motion-reduce:data-ending-style:scale-100 motion-reduce:data-starting-style:scale-100",
          // The title stops short of the close button and never runs under it.
          "has-[>[data-slot=dialog-close]]:*:data-[slot=dialog-header]:pr-control-sm",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button variant="ghost" size="sm" iconOnly className="absolute top-2 right-2" />
            }
          >
            <X aria-hidden />
            Close
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

/** The title and description, at the top. */
function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="dialog-header" className={cn("flex flex-col gap-1", className)} {...props} />
  );
}

/** A `div`'s props, plus `showCloseButton`. */
type DialogFooterProps = ComponentProps<"div"> & {
  /** Adds a "Close" button, for a dialog that only informs. */
  showCloseButton?: boolean;
};

/**
 * The dialog's buttons. On a phone they stack at full width with the main one on top, where a
 * thumb reaches it. From `sm` up they sit in a row at the end.
 */
function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: DialogFooterProps) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-(--dialog-spacing) -mb-(--dialog-spacing) flex flex-col-reverse gap-2 rounded-b-[calc(var(--radius-lg)-1px)] border-t bg-muted/50 p-(--dialog-spacing) sm:flex-row sm:flex-wrap sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton ? (
        <DialogPrimitive.Close render={<Button variant="outline" />}>Close</DialogPrimitive.Close>
      ) : null}
    </div>
  );
}

/** The dialog's name. It wraps, and its lines do not collide. */
function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-title leading-snug font-medium wrap-break-word", className)}
      {...props}
    />
  );
}

/** What the dialog is asking or telling. A screen reader reads it after the title. */
function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-body wrap-break-word text-muted-foreground *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
export type { DialogContentProps, DialogFooterProps };
