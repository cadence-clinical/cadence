import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/** An `svg`'s props. */
type SpinnerProps = ComponentProps<"svg">;

/**
 * Shows that something is in progress. On its own it is a status named "Loading": pass
 * `aria-label` to name it in your users' language. Beside text that already says what is
 * happening, such as a Button's "Saving", pass `aria-hidden` so it is not announced twice.
 *
 * It turns, and when the user asks for reduced motion it fades in and out instead.
 */
function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <LoaderCircle
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-control-icon animate-spin motion-reduce:animate-pulse", className)}
      {...props}
    />
  );
}

export { Spinner };
export type { SpinnerProps };
