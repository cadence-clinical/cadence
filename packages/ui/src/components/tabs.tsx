import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

/**
 * Views of one subject, one shown at a time. The arrow keys move between tabs and Enter or Space
 * shows one, so moving through the tabs does not load each view on the way.
 */
function Tabs({ className, orientation = "horizontal", ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn("group/tabs flex gap-2 data-[orientation=horizontal]:flex-col", className)}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  [
    // `relative`, so the indicator that slides between tabs is placed against the list.
    "group/tabs-list relative inline-flex w-fit max-w-full items-stretch text-muted-foreground",
    // Tabs that do not fit wrap onto another row. They are never clipped or scrolled out of view.
    "group-data-[orientation=horizontal]/tabs:flex-wrap",
    "group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
  ],
  {
    variants: {
      variant: {
        default: "gap-0.5 rounded-lg bg-muted p-0.5",
        line: [
          "gap-1 border-border",
          "group-data-[orientation=horizontal]/tabs:border-b",
          "group-data-[orientation=vertical]/tabs:border-r",
        ],
      },
    },
    defaultVariants: { variant: "default" },
  },
);

/** The Base UI Tabs List's props, plus `variant`. */
type TabsListProps = TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>;

/**
 * The row of tabs. `default` is a segmented control, and `line` underlines the tab that is shown.
 * The mark of the shown tab slides to the tab chosen with the pointer.
 */
function TabsList({ className, variant = "default", children, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      <TabsIndicator />
      {children}
    </TabsPrimitive.List>
  );
}

/**
 * The mark of the shown tab, which slides to the tab chosen with the pointer. Chosen from the
 * keyboard, or with reduced motion, it is simply there: the change is what matters, not the trip.
 *
 * Base UI hides it until it has measured the tab, and on the server it is hidden. Until then the
 * shown tab draws its own mark, and once the indicator is shown the tab's own mark gives way.
 */
function TabsIndicator({ className, ...props }: TabsPrimitive.Indicator.Props) {
  return (
    <TabsPrimitive.Indicator
      data-slot="tabs-indicator"
      className={cn(
        "pointer-events-none absolute top-0 left-0 z-0",
        "translate-x-(--active-tab-left) translate-y-(--active-tab-top)",
        // Movement is a transform. The size changes too, on an empty box that nothing flows
        // around, so it costs no layout elsewhere.
        "transition-[translate,width,height] duration-150 ease-out-strong",
        "group-has-[:focus-visible]/tabs-list:transition-none motion-reduce:transition-none",
        "group-data-[variant=default]/tabs-list:h-(--active-tab-height) group-data-[variant=default]/tabs-list:w-(--active-tab-width) group-data-[variant=default]/tabs-list:rounded-md group-data-[variant=default]/tabs-list:border group-data-[variant=default]/tabs-list:border-input group-data-[variant=default]/tabs-list:bg-background",
        "group-data-[variant=line]/tabs-list:bg-primary-text",
        "group-data-[variant=line]/tabs-list:group-data-[orientation=horizontal]/tabs:top-auto group-data-[variant=line]/tabs-list:group-data-[orientation=horizontal]/tabs:-bottom-px group-data-[variant=line]/tabs-list:group-data-[orientation=horizontal]/tabs:h-0.5 group-data-[variant=line]/tabs-list:group-data-[orientation=horizontal]/tabs:w-(--active-tab-width) group-data-[variant=line]/tabs-list:group-data-[orientation=horizontal]/tabs:translate-y-0",
        "group-data-[variant=line]/tabs-list:group-data-[orientation=vertical]/tabs:-right-px group-data-[variant=line]/tabs-list:group-data-[orientation=vertical]/tabs:left-auto group-data-[variant=line]/tabs-list:group-data-[orientation=vertical]/tabs:h-(--active-tab-height) group-data-[variant=line]/tabs-list:group-data-[orientation=vertical]/tabs:w-0.5 group-data-[variant=line]/tabs-list:group-data-[orientation=vertical]/tabs:translate-x-0",
        className,
      )}
      {...props}
    />
  );
}

/**
 * One tab. The tab that is shown is marked by shape as well as colour: a raised fill in the
 * `default` list, and a rule in the `line` list.
 */
function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex min-h-control-sm flex-1 items-center justify-center gap-control-gap rounded-md border border-transparent px-control-x py-0.5 text-control leading-snug font-medium select-none",
        "group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start group-data-[orientation=vertical]/tabs:text-left",
        "hover:text-foreground data-active:text-foreground",
        // Tabs are changed often and from the keyboard, so nothing animates.
        // The ring is drawn over the neighbouring tabs, not under them.
        "outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring",
        // The arrow keys still reach a disabled tab, so it can be found. Its words fade and its
        // focus ring does not.
        "data-disabled:pointer-events-none data-disabled:text-muted-foreground/50",
        "has-data-[icon=inline-end]:pr-[calc(var(--control-padding)*0.8)] has-data-[icon=inline-start]:pl-[calc(var(--control-padding)*0.8)]",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-control-icon",
        // A target as high as a control, centred on the tab: 44px when the density is comfortable.
        "before:absolute before:top-1/2 before:left-0 before:h-control before:w-full before:-translate-y-1/2",
        "group-data-[variant=default]/tabs-list:data-active:border-input group-data-[variant=default]/tabs-list:data-active:bg-background",
        // Once the indicator is shown, it is the mark, and the tab's own gives way to it.
        "group-has-[[data-slot=tabs-indicator]:not([hidden])]/tabs-list:data-active:border-transparent group-has-[[data-slot=tabs-indicator]:not([hidden])]/tabs-list:data-active:bg-transparent",
        "group-has-[[data-slot=tabs-indicator]:not([hidden])]/tabs-list:data-active:after:opacity-0",
        // The rule sits on the list's own border, so the two read as one line with a heavier part.
        // It is the mark of the shown tab, so it takes the token whose contrast is asserted on
        // the page and on a card.
        "after:absolute after:bg-primary-text after:opacity-0 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        "group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:-bottom-px group-data-[orientation=horizontal]/tabs:after:h-0.5",
        "group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-px group-data-[orientation=vertical]/tabs:after:w-0.5",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The view a tab shows. It takes focus after its tab, so a keyboard reaches a view that has
 * nothing of its own to focus, and it shows a ring when it does.
 */
function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(
        "flex-1 rounded-md text-body outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsIndicator, TabsList, tabsListVariants, TabsTrigger };
export type { TabsListProps };
