import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";

import { cn } from "@/lib/cn";

/** The Base UI Separator's props. */
type SeparatorProps = SeparatorPrimitive.Props;

/**
 * A rule between two groups of content. It is announced as a separator. For a line that is only
 * decoration, use a border.
 */
function Separator({ className, orientation = "horizontal", ...props }: SeparatorProps) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
export type { SeparatorProps };
