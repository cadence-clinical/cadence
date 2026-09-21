import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { cn } from "@/lib/cn";

/**
 * Groups tooltips so they share a delay. The first one waits before it opens, so a pointer that
 * is only passing does not set it off. While one is open, the next opens at once and without
 * animation, which is what makes a toolbar quick to explore. Wrap a toolbar, or the whole app.
 */
function TooltipProvider(props: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" {...props} />;
}

/**
 * A short hint shown when its trigger is hovered or focused.
 *
 * It is never the only place something is said. It does not open on a touch screen and it is not
 * announced by a screen reader, so the trigger needs its own name, and anything a person needs in
 * order to act belongs on the screen.
 */
function Tooltip(props: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

/** What the tooltip describes. Pass the control through `render`, such as an icon-only Button. */
function TooltipTrigger(props: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

/** The Base UI Tooltip Popup's props, plus where the hint sits against its trigger. */
type TooltipContentProps = TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">;

/** The hint. It wraps, and it grows from the side of its trigger. */
function TooltipContent({
  className,
  side = "top",
  sideOffset = 6,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "w-fit max-w-xs origin-(--transform-origin) rounded-md bg-foreground px-2 py-1 text-control-sm leading-snug wrap-break-word text-background",
            // Fast, and from where the trigger is. Only opacity and transform move.
            "transition-[opacity,transform] duration-[125ms] ease-out-strong",
            "data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-starting-style:scale-[0.97] data-starting-style:opacity-0",
            // No animation when it follows another tooltip or opens from the keyboard.
            "data-instant:transition-none",
            // Reduced motion keeps the fade and drops the movement.
            "motion-reduce:data-ending-style:scale-100 motion-reduce:data-starting-style:scale-100",
            className,
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow
            data-slot="tooltip-arrow"
            className="size-2 rotate-45 rounded-[1px] bg-foreground data-[side=bottom]:-top-1 data-[side=left]:-right-1 data-[side=right]:-left-1 data-[side=top]:-bottom-1"
          />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
export type { TooltipContentProps };
