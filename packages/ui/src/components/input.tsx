import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/cn";

/** The Base UI Input's props. */
type InputProps = InputPrimitive.Props;

/**
 * A single-line text input. Its height, padding and text follow the density set on <html>.
 *
 * It needs an accessible name: a `Label` whose `htmlFor` is this input's `id`, or an `aria-label`.
 * A placeholder is not a name. Set `aria-invalid` when the value is wrong, and say what is wrong in
 * text beside it: the border alone is not enough.
 */
function Input({ className, ...props }: InputProps) {
  return (
    <InputPrimitive
      data-slot="input"
      className={cn(
        "h-control w-full min-w-0 rounded-md border border-input bg-background px-control-x text-control text-foreground tabular-nums",
        // iOS zooms the page when a focused input's text is under 16px, so touch devices get 16px.
        "pointer-coarse:text-base",
        "transition-[border-color,box-shadow] duration-150 ease-out-strong outline-none motion-reduce:transition-none",
        "placeholder:text-muted-foreground",
        // The ring token holds 3:1 against the page and a card, so it is never thinned or faded.
        "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
        // Invalid is a heavier border as well as a colour, and Field adds the message.
        "aria-invalid:border-critical-border aria-invalid:ring-1 aria-invalid:ring-critical-border",
        // A read-only value is still read, so it keeps full contrast. A disabled one is faded.
        "read-only:bg-muted disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50",
        "file:inline-flex file:h-full file:border-0 file:bg-transparent file:text-control file:font-medium file:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
export type { InputProps };
