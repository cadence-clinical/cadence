import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import type { ComponentProps } from "react";

import { Button, type ButtonProps } from "@/components/cadence/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/cadence/dialog";
import { cn } from "@/lib/cn";

/**
 * A dialog that must be answered before anything else: confirming an action that stops, removes
 * or cannot be undone. A press outside does not close it. Escape does, and counts as cancelling.
 *
 * It is a Dialog with `role="alertdialog"`, no close button in the corner, and the cancel choice
 * first, so that focus lands on the safe answer.
 */
const AlertDialog = AlertDialogPrimitive.Root;

/** Opens the alert dialog. Render it as a `Button` through `render`. */
function AlertDialogTrigger(props: AlertDialogPrimitive.Trigger.Props) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

/** Where the alert dialog is rendered: at the end of `body`, unless it is given a `container`. */
const AlertDialogPortal = AlertDialogPrimitive.Portal;

/** The Base UI Dialog Popup's props. */
type AlertDialogContentProps = AlertDialogPrimitive.Popup.Props;

/**
 * The alert dialog itself, with its scrim. It looks and moves as a Dialog does, and has no close
 * button in the corner: the answer is given in the footer.
 */
function AlertDialogContent(props: AlertDialogContentProps) {
  return <DialogContent data-slot="alert-dialog-content" showCloseButton={false} {...props} />;
}

/** The title and description, at the top. */
function AlertDialogHeader(props: ComponentProps<"div">) {
  return <DialogHeader data-slot="alert-dialog-header" {...props} />;
}

/** The answers. Put `AlertDialogCancel` first, so that focus lands on it. */
function AlertDialogFooter(props: ComponentProps<"div">) {
  return <DialogFooter data-slot="alert-dialog-footer" {...props} />;
}

/** An icon beside the title, for what the question is about. */
function AlertDialogMedia({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        "mb-1 inline-flex size-control-lg shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&>svg]:size-control-icon",
        className,
      )}
      {...props}
    />
  );
}

/** The question, as the dialog's name. */
function AlertDialogTitle(props: AlertDialogPrimitive.Title.Props) {
  return <DialogTitle data-slot="alert-dialog-title" {...props} />;
}

/** What answering will do. A screen reader reads it after the title. */
function AlertDialogDescription(props: AlertDialogPrimitive.Description.Props) {
  return <DialogDescription data-slot="alert-dialog-description" {...props} />;
}

/** The Base UI Dialog Close's props, plus a Button's `variant` and `size`. */
type AlertDialogButtonProps = AlertDialogPrimitive.Close.Props &
  Pick<ButtonProps, "variant" | "size">;

/**
 * The answer that does the thing. It closes the dialog when pressed, after `onClick`. For an
 * action that may fail and must keep the dialog open, control `open` on the `AlertDialog`.
 */
function AlertDialogAction({ variant = "primary", size, ...props }: AlertDialogButtonProps) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-action"
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  );
}

/** The answer that does nothing. It closes the dialog, and it comes first in the footer. */
function AlertDialogCancel({ variant = "outline", size, ...props }: AlertDialogButtonProps) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
export type { AlertDialogButtonProps, AlertDialogContentProps };
