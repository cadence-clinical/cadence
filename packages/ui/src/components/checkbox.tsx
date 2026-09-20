import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/cn";

/** The Base UI Checkbox's props. */
type CheckboxProps = CheckboxPrimitive.Root.Props;

/**
 * A choice that is on, off or, with `indeterminate`, partly on. Wrap it in a `Label` to name it.
 *
 * The box is small and the target is not: the area that takes a click or a tap is as high as a
 * control, so it is 44px when the density is comfortable.
 */
function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "group/checkbox peer relative inline-flex size-control-indicator shrink-0 items-center justify-center rounded-sm border border-input bg-background",
        // The target, centred on the box and as large as a control.
        "after:absolute after:top-1/2 after:left-1/2 after:size-control after:-translate-1/2",
        "transition-[background-color,border-color] duration-150 ease-out-strong outline-none motion-reduce:transition-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground",
        "data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground",
        "aria-invalid:border-critical-border aria-invalid:ring-1 aria-invalid:ring-critical-border",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current [&>svg]:size-[calc(var(--control-indicator)-0.25rem)]"
      >
        <Check aria-hidden className="group-data-indeterminate/checkbox:hidden" strokeWidth={3} />
        <Minus
          aria-hidden
          className="hidden group-data-indeterminate/checkbox:block"
          strokeWidth={3}
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
export type { CheckboxProps };
