"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";

import { cn } from "@/lib/cn";

/** The Base UI Collapsible Root's props. */
type CollapsibleProps = CollapsiblePrimitive.Root.Props;

/**
 * One section that opens and closes, such as earlier entries or further detail. The trigger says
 * whether it is open, and the section is out of the page while it is closed.
 */
function Collapsible(props: CollapsibleProps) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

/** The Base UI Collapsible Trigger's props. */
type CollapsibleTriggerProps = CollapsiblePrimitive.Trigger.Props;

/**
 * Opens and closes the section. Render it as a Button through `render`. It carries
 * `data-panel-open` while the section is open, so an icon inside can turn with
 * `in-data-[panel-open]:rotate-180`.
 */
function CollapsibleTrigger(props: CollapsibleTriggerProps) {
  return <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />;
}

/** The Base UI Collapsible Panel's props. */
type CollapsibleContentProps = CollapsiblePrimitive.Panel.Props;

/**
 * The section. It grows to its height as it opens and shrinks as it closes, in 150ms, and without
 * motion when the user asks for reduced motion.
 */
function CollapsibleContent({ className, ...props }: CollapsibleContentProps) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      className={cn(
        "h-(--collapsible-panel-height) overflow-hidden",
        "transition-[height] duration-150 ease-out-strong motion-reduce:transition-none",
        "data-ending-style:h-0 data-starting-style:h-0",
        className,
      )}
      {...props}
    />
  );
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
export type { CollapsibleContentProps, CollapsibleProps, CollapsibleTriggerProps };
