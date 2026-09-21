import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/**
 * A small panel that opens from a trigger and leaves the page in reach: filters, settings, or
 * more about one thing. For a task that must finish before the page carries on, use a Dialog.
 */
const Popover = PopoverPrimitive.Root;

/** Opens the popover. Render it as a `Button` through `render`. */
function PopoverTrigger(props: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

/** The Base UI Popover Popup's props, plus where the panel sits against its trigger. */
type PopoverContentProps = PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">;

/**
 * The panel. It is never wider or taller than the room it has: what does not fit wraps or scrolls
 * inside it.
 *
 * Opened with the pointer, it grows from its trigger with a short fade. Opened from the keyboard,
 * or dismissed, it does not animate: Base UI marks both as instant.
 */
function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "flex max-h-(--available-height) w-72 max-w-(--available-width) origin-(--transform-origin) flex-col gap-container-sm overflow-y-auto rounded-lg border bg-popover p-container text-body wrap-break-word text-popover-foreground shadow-md",
            // A panel with nothing inside to focus takes focus itself, and shows that it has.
            "outline-none focus-visible:ring-2 focus-visible:ring-ring",
            // Tailwind sets `scale` as its own property, so that is the property that transitions.
            "transition-[opacity,scale] duration-150 ease-out-strong data-instant:transition-none",
            "data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-starting-style:scale-[0.97] data-starting-style:opacity-0",
            "motion-reduce:transition-[opacity] motion-reduce:data-ending-style:scale-100 motion-reduce:data-starting-style:scale-100",
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

/** The title and description, at the top. */
function PopoverHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="popover-header" className={cn("flex flex-col gap-0.5", className)} {...props} />
  );
}

/** The panel's name. */
function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("leading-snug font-medium wrap-break-word", className)}
      {...props}
    />
  );
}

/** What the panel is for. A screen reader reads it after the title. */
function PopoverDescription({ className, ...props }: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("wrap-break-word text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger };
export type { PopoverContentProps };
