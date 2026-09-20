import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/cn";

/** The Base UI Switch's props. */
type SwitchProps = SwitchPrimitive.Root.Props;

/**
 * Turns a setting on or off, and the change applies at once. For a choice that is saved with the
 * rest of a form, use a Checkbox. Wrap it in a `Label` to name it.
 *
 * On and off differ by the position of the thumb as well as by colour.
 */
function Switch({ className, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer relative inline-flex h-[calc(var(--control-indicator)+4px)] w-[calc(var(--control-indicator)*2)] shrink-0 items-center rounded-full p-0.5",
        // The target, centred on the switch and as high as a control.
        "after:absolute after:top-1/2 after:left-1/2 after:h-control after:w-[calc(100%+var(--control-gap)*2)] after:-translate-1/2",
        "transition-[background-color] duration-150 ease-out-strong outline-none motion-reduce:transition-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "data-checked:bg-primary data-unchecked:bg-input",
        "aria-invalid:ring-2 aria-invalid:ring-critical-border",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Each thumb sits on a track it is contrast-tested against, in every mode.
          "pointer-events-none block size-control-indicator rounded-full bg-background data-checked:bg-primary-foreground",
          "transition-[transform,background-color] duration-150 ease-out-strong motion-reduce:transition-none",
          "data-checked:translate-x-[calc(var(--control-indicator)-4px)]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
export type { SwitchProps };
