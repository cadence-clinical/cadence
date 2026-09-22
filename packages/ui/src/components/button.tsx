import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { Children, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/** The Button's classes, for giving another element, such as a link, the look of a button. */
const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center rounded-md border border-transparent",
    "font-medium whitespace-nowrap select-none",
    // Only the properties that change are transitioned. Press feedback is fast and eases out.
    "transition-[background-color,border-color,color,transform] duration-150 ease-out-strong",
    "active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50",
    // An icon follows the density, like the control it sits in: 16px compact, 20px comfortable.
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-control-icon",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_8%)]",
        // Control boundaries use the input token, which holds 3:1 against the page.
        outline: "border-input bg-background text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        // A destructive action is a solid critical fill. Tinted fills are too easy to miss.
        destructive:
          "bg-critical text-critical-foreground hover:bg-critical/90 focus-visible:ring-critical-border",
        link: "text-primary-text underline-offset-4 hover:underline",
      },
      // Height and text step together. An icon is lighter than text, so the side that holds one
      // takes less padding to look balanced. The icon says which side it is on with data-icon.
      size: {
        sm: "h-control-sm gap-control-gap px-control-x text-control-sm has-data-[icon=inline-end]:pr-[calc(var(--control-padding)*0.8)] has-data-[icon=inline-start]:pl-[calc(var(--control-padding)*0.8)]",
        md: "h-control gap-control-gap px-control-x text-control has-data-[icon=inline-end]:pr-[calc(var(--control-padding)*0.8)] has-data-[icon=inline-start]:pl-[calc(var(--control-padding)*0.8)]",
        lg: "h-control-lg gap-control-gap px-control-x text-control-lg has-data-[icon=inline-end]:pr-[calc(var(--control-padding)*0.8)] has-data-[icon=inline-start]:pl-[calc(var(--control-padding)*0.8)]",
      },
      // Its own option, not a size, so an icon-only button comes in every size. The button is
      // square, and everything in it but the icon is hidden from sight and kept for its name.
      iconOnly: {
        true: "aspect-square px-0 has-data-[icon=inline-end]:pr-0 has-data-[icon=inline-start]:pl-0 [&>:not(svg,[data-icon])]:sr-only",
        false: "",
      },
    },
    // A link sits in running text, so it drops the control box whatever size was asked for.
    compoundVariants: [
      {
        variant: "link",
        class: "h-auto px-0 has-data-[icon=inline-end]:pr-0 has-data-[icon=inline-start]:pl-0",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
      iconOnly: false,
    },
  },
);

/** The Base UI Button's props, plus `variant`, `size` and `iconOnly`. */
type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>;

/** CSS cannot select a bare text node, so text is wrapped in an element that it can hide. */
function wrapText(children: ReactNode): ReactNode {
  return Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? <span>{child}</span> : child,
  );
}

/**
 * Triggers an action. Height, padding, text and icon follow the density set on <html>, so the
 * same button is 32px on a workstation, 40px on a touch device, and 44px when the density is
 * comfortable.
 *
 * An icon beside the label carries `data-icon="inline-start"` or `data-icon="inline-end"` and no
 * size class: the button sizes and spaces it.
 *
 * For a button that shows only its icon, set `iconOnly` and keep the label as its text:
 * `<Button iconOnly><Printer />Print chart</Button>`. The text is hidden from sight and is still
 * the button's accessible name, so there is no `aria-label` to forget.
 */
function Button({ className, variant, size, iconOnly, children, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, iconOnly }), className)}
      {...props}
    >
      {iconOnly ? wrapText(children) : children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
