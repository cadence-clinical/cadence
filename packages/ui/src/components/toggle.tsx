import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { Children, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/** The Toggle's classes, for giving another element the look of a toggle. */
const toggleVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center rounded-md border border-transparent",
    "font-medium whitespace-nowrap text-foreground select-none",
    "transition-[background-color,border-color,box-shadow] duration-150 ease-out-strong motion-reduce:transition-none",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "hover:bg-muted data-disabled:pointer-events-none data-disabled:opacity-50",
    // Pressed is a fill and a boundary. The fill alone is too close to the page to tell the two
    // states apart, and the boundary holds 3:1, so the state never rests on colour.
    "data-pressed:bg-accent data-pressed:text-accent-foreground",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-control-icon",
  ],
  {
    variants: {
      variant: {
        ghost: "data-pressed:border-input",
        // The boundary is already there, so pressed makes it heavier and gives it the accent.
        outline:
          "border-input bg-background data-pressed:border-primary data-pressed:ring-1 data-pressed:ring-primary data-pressed:ring-inset",
      },
      // Height and text step together, as in a Button.
      size: {
        sm: "h-control-sm min-w-control-sm gap-control-gap px-control-x text-control-sm has-data-[icon=inline-end]:pr-[calc(var(--control-padding)*0.8)] has-data-[icon=inline-start]:pl-[calc(var(--control-padding)*0.8)]",
        md: "h-control min-w-control gap-control-gap px-control-x text-control has-data-[icon=inline-end]:pr-[calc(var(--control-padding)*0.8)] has-data-[icon=inline-start]:pl-[calc(var(--control-padding)*0.8)]",
        lg: "h-control-lg min-w-control-lg gap-control-gap px-control-x text-control-lg has-data-[icon=inline-end]:pr-[calc(var(--control-padding)*0.8)] has-data-[icon=inline-start]:pl-[calc(var(--control-padding)*0.8)]",
      },
      // Its own option, not a size, so an icon-only toggle comes in every size.
      iconOnly: {
        true: "aspect-square px-0 has-data-[icon=inline-end]:pr-0 has-data-[icon=inline-start]:pl-0 [&>:not(svg,[data-icon])]:sr-only",
        false: "",
      },
    },
    defaultVariants: { variant: "ghost", size: "md", iconOnly: false },
  },
);

/** The Base UI Toggle's props, plus `variant`, `size` and `iconOnly`. */
type ToggleProps = TogglePrimitive.Props & VariantProps<typeof toggleVariants>;

/** CSS cannot select a bare text node, so text is wrapped in an element that it can hide. */
function wrapText(children: ReactNode): ReactNode {
  return Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? <span>{child}</span> : child,
  );
}

/**
 * A button that stays pressed: bold, a filter, a view that is on or off. For a setting that
 * applies at once and has a label beside it, use a Switch.
 *
 * With `iconOnly`, keep the label as the toggle's text. It is hidden from sight and is still the
 * accessible name: `<Toggle iconOnly><Bold />Bold</Toggle>`.
 */
function Toggle({ className, variant, size, iconOnly, children, ...props }: ToggleProps) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, iconOnly }), className)}
      {...props}
    >
      {iconOnly ? wrapText(children) : children}
    </TogglePrimitive>
  );
}

export { Toggle, toggleVariants };
export type { ToggleProps };
