import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center rounded-md border border-transparent",
    "font-medium whitespace-nowrap select-none",
    // Only the properties that change are transitioned. Press feedback is fast and eases out.
    "transition-[background-color,border-color,color,transform] duration-150 ease-out-strong",
    "active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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
      size: {
        sm: "h-control-sm gap-control-gap px-control-x text-control",
        md: "h-control gap-control-gap px-control-x text-control",
        lg: "h-control-lg gap-control-gap px-control-x text-control",
        icon: "size-control",
      },
    },
    // A link sits in running text, so it drops the control box whatever size was asked for.
    compoundVariants: [{ variant: "link", class: "h-auto px-0" }],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>;

/**
 * Triggers an action. Height, padding and text size follow the density set on <html>, so the
 * same button is 32px on a workstation and 44px on a touch device.
 *
 * An icon-only button must carry an `aria-label`.
 */
function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
