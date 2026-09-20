import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "@/lib/cn";

/** The Base UI Radio Group's props. */
type RadioGroupProps = RadioGroupPrimitive.Props;
/** The Base UI Radio's props. */
type RadioGroupItemProps = RadioPrimitive.Root.Props;

/**
 * One choice from a few, all visible at once. Name the group with `aria-labelledby` or
 * `aria-label`, and wrap each item in a `Label`.
 */
function RadioGroup({ className, ...props }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid w-full gap-control-gap", className)}
      {...props}
    />
  );
}

/** One option. The area that takes a click or a tap is as high as a control. */
function RadioGroupItem({ className, ...props }: RadioGroupItemProps) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        "peer relative inline-flex size-control-indicator shrink-0 items-center justify-center rounded-full border border-input bg-background",
        "after:absolute after:top-1/2 after:left-1/2 after:size-control after:-translate-1/2",
        "transition-[background-color,border-color] duration-150 ease-out-strong outline-none motion-reduce:transition-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "data-checked:border-primary data-checked:bg-primary",
        "aria-invalid:border-critical-border aria-invalid:ring-1 aria-invalid:ring-critical-border",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="size-[40%] rounded-full bg-primary-foreground"
      />
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
export type { RadioGroupItemProps, RadioGroupProps };
