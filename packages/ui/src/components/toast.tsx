"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { CircleCheck, Info, OctagonAlert, TriangleAlert, X } from "lucide-react";
import type { ReactElement } from "react";

import { Button } from "@/components/cadence/button";
import { Spinner } from "@/components/cadence/spinner";
import { cn } from "@/lib/cn";

/**
 * The toast manager for the whole app: `toast.add({ title, description, type })` shows one.
 * A toast goes away, so it is never the only place an error or a result is shown.
 */
const toast = ToastPrimitive.createToastManager();

/** Holds the toasts for everything inside it. `Toaster` includes one. */
function ToastProvider(props: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />;
}

/** Where the toasts are rendered: at the end of `body`. */
function ToastPortal(props: ToastPrimitive.Portal.Props) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />;
}

/** Where the toasts stack: the bottom of the screen on a phone, its corner on a larger one. */
function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto w-auto max-w-sm outline-none sm:right-4 sm:left-auto sm:mx-0 sm:w-full",
        className,
      )}
      {...props}
    />
  );
}

/** One toast. The newest is in front, and the older ones peek out behind it until hovered. */
function Toast({ className, ...props }: ToastPrimitive.Root.Props) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        // The controls inside fill with the toast's colour, not the page's.
        "[--background:var(--popover)]",
        "group/toast pointer-events-auto absolute right-0 bottom-0 z-[calc(1000-var(--toast-index))] w-full origin-bottom rounded-lg border bg-popover text-body text-popover-foreground shadow-lg will-change-transform outline-none select-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]",
        "h-(--height) [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] [transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms]",
        // With reduced motion a toast fades in and out, and does not slide.
        "motion-reduce:[transition:opacity_150ms]",
        "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
        "data-expanded:h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]",
        "data-limited:opacity-0 data-starting-style:[transform:translateY(150%)]",
        "motion-reduce:data-ending-style:opacity-0 motion-reduce:data-starting-style:opacity-0",
        "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(150%)]",
        "data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        "data-expanded:data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-expanded:data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The toast's icon, words and buttons, in a row. It keeps its own height: Base UI measures it to
 * size the toast, so filling the toast would resize what is being measured, in a loop.
 */
function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        "flex items-center gap-(--container-padding-sm) overflow-hidden p-container transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-behind:opacity-0 data-expanded:opacity-100 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

/** What happened, in a few words. It carries the meaning: the icon only repeats it. */
function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn("font-medium wrap-break-word", className)}
      {...props}
    />
  );
}

/** More about what happened. */
function ToastDescription({ className, ...props }: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("wrap-break-word text-muted-foreground", className)}
      {...props}
    />
  );
}

/** A button that acts on what happened, such as "Undo". An outline Button unless given `render`. */
function ToastAction({
  className,
  render = <Button variant="outline" size="sm" />,
  ...props
}: ToastPrimitive.Action.Props) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}

/** Dismisses the toast. It is named "Close". */
function ToastClose({
  className,
  children,
  render = <Button variant="ghost" size="sm" iconOnly />,
  ...props
}: ToastPrimitive.Close.Props) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      render={render}
      className={cn("shrink-0 text-muted-foreground hover:text-foreground", className)}
      {...props}
    >
      {/* The word is in its own element, so an icon-only Button can hide it and still say it. */}
      {children ?? (
        <>
          <X aria-hidden />
          <span>Close</span>
        </>
      )}
    </ToastPrimitive.Close>
  );
}

/**
 * The mark for each type, the same outlines as an Alert's, so no two types differ by colour
 * alone. `error` is Cadence's critical status.
 */
const ICONS: Record<string, { icon: ReactElement; tone: string }> = {
  success: { icon: <CircleCheck aria-hidden />, tone: "text-success-text" },
  info: { icon: <Info aria-hidden />, tone: "text-info-text" },
  warning: { icon: <TriangleAlert aria-hidden />, tone: "text-warning-text" },
  error: { icon: <OctagonAlert aria-hidden />, tone: "text-critical-text" },
  loading: { icon: <Spinner aria-hidden />, tone: "text-muted-foreground" },
};

function ToastIcon({ type }: { type: string | undefined }) {
  const mark = type === undefined ? undefined : ICONS[type];
  if (!mark) return null;
  return (
    <span
      data-slot="toast-icon"
      className={cn(
        "shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-control-icon",
        mark.tone,
      )}
    >
      {mark.icon}
    </span>
  );
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();
  return toasts.map((item) => (
    <Toast key={item.id} toast={item}>
      <ToastContent>
        <ToastIcon type={item.type} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <ToastTitle />
          <ToastDescription />
        </div>
        <ToastAction />
        <ToastClose />
      </ToastContent>
    </Toast>
  ));
}

/**
 * Put it once around the app. It shows the toasts that `toast.add` adds. Hovering or focusing
 * them pauses their timers, and F6 moves focus to them.
 */
function Toaster({ children, toastManager = toast, ...props }: ToastPrimitive.Provider.Props) {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  );
}

const createToastManager = ToastPrimitive.createToastManager;
const useToastManager = ToastPrimitive.useToastManager;

export {
  createToastManager,
  toast,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  Toaster,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToastManager,
};
