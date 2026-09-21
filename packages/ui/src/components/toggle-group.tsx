"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { createContext, useContext, type CSSProperties } from "react";

import { Toggle, type ToggleProps } from "@/components/cadence/toggle";
import { cn } from "@/lib/cn";

/** What the group sets once for every toggle in it. */
interface ToggleGroupOptions {
  variant?: ToggleProps["variant"];
  size?: ToggleProps["size"];
  iconOnly?: ToggleProps["iconOnly"];
  spacing: number;
}

const ToggleGroupContext = createContext<ToggleGroupOptions>({ spacing: 2 });

/** The Base UI Toggle Group's props, plus what it sets for every toggle in it. */
type ToggleGroupProps = ToggleGroupPrimitive.Props &
  Partial<ToggleGroupOptions> & {
    /** The gap between toggles, in spacing units. `0` joins them into one segmented control. */
    spacing?: number;
  };

/**
 * A set of toggles that belong together: text styles, or a few filters. Give it an `aria-label`,
 * which names the set. One toggle is pressed at a time unless `multiple` is set.
 *
 * Pressing the pressed toggle releases it, so a group can have nothing pressed. For a choice
 * that must always have an answer, such as which of two views is shown, use Tabs or a Radio group.
 */
function ToggleGroup({
  className,
  variant,
  size,
  iconOnly,
  spacing = 2,
  orientation = "horizontal",
  style,
  children,
  ...props
}: ToggleGroupProps) {
  const gap: CSSProperties & Record<"--gap", number> = { "--gap": spacing };
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-spacing={spacing}
      data-orientation={orientation}
      orientation={orientation}
      style={typeof style === "function" ? style : { ...gap, ...style }}
      className={cn(
        // A group that does not fit wraps onto another row. No toggle is clipped.
        "group/toggle-group flex w-fit max-w-full flex-row flex-wrap items-center gap-[--spacing(var(--gap))]",
        "data-[orientation=vertical]:flex-col data-[orientation=vertical]:flex-nowrap data-[orientation=vertical]:items-stretch",
        className,
      )}
      {...props}
    >
      <ToggleGroupContext value={{ variant, size, iconOnly, spacing }}>
        {children}
      </ToggleGroupContext>
    </ToggleGroupPrimitive>
  );
}

/**
 * One toggle of the group. It is a `Toggle`, so pressed is a fill and a boundary, never colour
 * alone. What the group sets for `variant`, `size` and `iconOnly` overrules the toggle's own.
 */
function ToggleGroupItem({ className, variant, size, iconOnly, ...props }: ToggleProps) {
  const group = useContext(ToggleGroupContext);
  return (
    <Toggle
      data-slot="toggle-group-item"
      data-spacing={group.spacing}
      variant={group.variant ?? variant}
      size={group.size ?? size}
      iconOnly={group.iconOnly ?? iconOnly}
      className={cn(
        // The focus ring is drawn over the neighbouring toggles, not under them.
        "shrink-0 focus-visible:z-10",
        // Joined, the toggles share their boundaries and only the ends are rounded.
        "group-data-[spacing=0]/toggle-group:rounded-none",
        "group-data-[orientation=horizontal]/toggle-group:group-data-[spacing=0]/toggle-group:first:rounded-l-md group-data-[orientation=horizontal]/toggle-group:group-data-[spacing=0]/toggle-group:last:rounded-r-md",
        "group-data-[orientation=vertical]/toggle-group:group-data-[spacing=0]/toggle-group:first:rounded-t-md group-data-[orientation=vertical]/toggle-group:group-data-[spacing=0]/toggle-group:last:rounded-b-md",
        "group-data-[orientation=horizontal]/toggle-group:group-data-[spacing=0]/toggle-group:not-first:-ml-px",
        "group-data-[orientation=vertical]/toggle-group:group-data-[spacing=0]/toggle-group:not-first:-mt-px",
        // The pressed toggle's boundary sits over its neighbours', so it is whole.
        "data-pressed:z-[1]",
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
export type { ToggleGroupOptions, ToggleGroupProps };
