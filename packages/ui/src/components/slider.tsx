"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/cn";

/** The Base UI Slider Root's props, plus `thumbLabels`. */
type SliderProps = SliderPrimitive.Root.Props & {
  /**
   * The name of each thumb, in order, for a slider with more than one, such as
   * `["Earliest", "Latest"]`. The slider's own label still names the group.
   */
  thumbLabels?: readonly string[];
};

/** One thumb for a single value, and one for each value of a range. */
function thumbCount(value: SliderProps["value"], defaultValue: SliderProps["defaultValue"]) {
  if (Array.isArray(value)) return value.length;
  if (Array.isArray(defaultValue)) return defaultValue.length;
  return 1;
}

/**
 * Chooses a setting from a range by dragging a thumb, or with the arrow keys. It is for a setting,
 * such as a zoom. A clinical value is typed exactly, in an Input.
 *
 * Give it an array to choose a range, with one thumb for each value.
 */
function Slider({
  className,
  value,
  defaultValue,
  min = 0,
  max = 100,
  thumbLabels,
  ...props
}: SliderProps) {
  const count = thumbCount(value, defaultValue);
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        "data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full",
        className,
      )}
      value={value}
      defaultValue={defaultValue}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control
        data-slot="slider-control"
        className={cn(
          // The whole strip is a target, as high as a control, so a press beside the thumb moves it.
          "relative flex touch-none items-center select-none data-disabled:opacity-50",
          "data-[orientation=horizontal]:h-control data-[orientation=horizontal]:w-full",
          "data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-40 data-[orientation=vertical]:w-control data-[orientation=vertical]:flex-col",
        )}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          // The unfilled track is the input colour, which is contrast-tested at 3:1 on the page,
          // a card and a popover, so the whole range can be seen.
          className="relative grow overflow-hidden rounded-full bg-input select-none data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: count }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            // A thumb is identified by its place, which never changes.
            key={index}
            index={index}
            aria-label={thumbLabels?.[index]}
            className={cn(
              "relative block size-control-indicator shrink-0 rounded-full border-2 border-primary bg-background select-none",
              // The target is as high as a control, centred on the thumb.
              "after:absolute after:-inset-[calc((var(--control-height)-var(--control-indicator))/2)]",
              // Focus is on the range input inside the thumb, so the thumb shows it.
              "outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background",
              "data-disabled:pointer-events-none",
            )}
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
export type { SliderProps };
