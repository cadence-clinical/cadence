import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * One choice from a list that opens below the field. Pass `items` so the field shows an option's
 * label, not its value, and give the trigger a `Label` or an `aria-label`.
 *
 * For a few options that are better seen all at once, use a Radio group.
 */
const Select = SelectPrimitive.Root;

/** Height and text step together, as they do in a Button. */
const TRIGGER_SIZES = {
  sm: "min-h-control-sm text-control-sm",
  md: "min-h-control text-control",
  lg: "min-h-control-lg text-control-lg",
} as const;

/** The Base UI Select Trigger's props, plus `size`. */
type SelectTriggerProps = SelectPrimitive.Trigger.Props & {
  size?: keyof typeof TRIGGER_SIZES;
};

/**
 * The field that shows the choice and opens the list. It has a minimum height, not a fixed one:
 * a long value wraps and the field grows, because a chosen value is never truncated.
 */
function SelectTrigger({ className, size = "md", children, ...props }: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-full min-w-0 items-center justify-between gap-control-gap rounded-md border border-input bg-background px-control-x py-1 text-left leading-snug text-foreground select-none",
        TRIGGER_SIZES[size],
        "transition-[border-color,box-shadow] duration-150 ease-out-strong outline-none motion-reduce:transition-none",
        // The ring token holds 3:1 against the page and a card, so it is never thinned or faded.
        "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
        "aria-invalid:border-critical-border aria-invalid:ring-1 aria-invalid:ring-critical-border",
        "data-placeholder:text-muted-foreground",
        // A read-only choice is still read, so it keeps full contrast. A disabled one is faded.
        "data-readonly:cursor-default data-readonly:bg-muted",
        "data-disabled:cursor-not-allowed data-disabled:bg-muted data-disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-control-icon",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        data-slot="select-icon"
        render={<ChevronDown aria-hidden className="text-muted-foreground" />}
      />
    </SelectPrimitive.Trigger>
  );
}

/** The chosen option's label, or the placeholder. It wraps. */
function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("min-w-0 flex-1 wrap-break-word", className)}
      {...props}
    />
  );
}

/** The Base UI Select Popup's props, plus where the list sits against the field. */
type SelectContentProps = SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >;

/**
 * The list of options. It opens below the field, so the field and its label stay in view, and it
 * opens at once: a select is opened often and from the keyboard, where an animation only delays.
 * It is as wide as the field, and an option too long for that wraps.
 *
 * Name it as well as the trigger, with `aria-labelledby` or `aria-label`. Base UI names the
 * trigger from its label and leaves the list unnamed, and a screen reader announces the list.
 */
function SelectContent({
  className,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = false,
  ...props
}: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-36 overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-md outline-none",
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List
            className="p-1"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
          >
            {children}
          </SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

/** A set of related options under a `SelectLabel`. */
function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1", className)}
      {...props}
    />
  );
}

/** The heading of a `SelectGroup`. */
function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-control-x py-1 text-control-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

/**
 * One option. It is as high as a control, so it is a 44px target when the density is comfortable.
 * The chosen option carries a tick, so the choice does not rely on colour, and a long option wraps.
 */
function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex min-h-control w-full cursor-default items-center gap-control-gap rounded-sm py-1 pr-8 pl-control-x text-control leading-snug outline-none select-none",
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-control-icon",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="min-w-0 flex-1 wrap-break-word">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        data-slot="select-item-indicator"
        className="pointer-events-none absolute right-2 flex items-center justify-center"
      >
        <Check aria-hidden />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

/** A rule between sets of options. */
function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

/** Shown at the top of a list that is scrolled down. */
function SelectScrollUpButton({ className, ...props }: SelectPrimitive.ScrollUpArrow.Props) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-control-icon",
        className,
      )}
      {...props}
    >
      <ChevronUp aria-hidden />
    </SelectPrimitive.ScrollUpArrow>
  );
}

/** Shown at the bottom of a list that has more below. */
function SelectScrollDownButton({ className, ...props }: SelectPrimitive.ScrollDownArrow.Props) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-control-icon",
        className,
      )}
      {...props}
    >
      <ChevronDown aria-hidden />
    </SelectPrimitive.ScrollDownArrow>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
export type { SelectContentProps, SelectTriggerProps };
