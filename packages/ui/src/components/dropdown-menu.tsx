"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { Check, ChevronRight } from "lucide-react";
import { createContext, useContext, type ComponentProps, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Whether a label is inside a group, which is the only place Base UI's group label can be. */
const InGroupContext = createContext(false);

/**
 * A list of actions that opens from a trigger. For choosing a value, use a Select: a menu does
 * things, a select holds a choice.
 */
const DropdownMenu = MenuPrimitive.Root;

/** Where the menu is rendered: at the end of `body`, unless it is given a `container`. */
const DropdownMenuPortal = MenuPrimitive.Portal;

/** Opens the menu. Render it as a `Button` through `render`. */
function DropdownMenuTrigger(props: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

/** The Base UI Menu Popup's props, plus where the menu sits against its trigger. */
type DropdownMenuContentProps = MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">;

/**
 * The menu. It opens at once: a menu is opened often and from the keyboard, where an animation
 * only delays. It is at least as wide as its trigger, never wider or taller than the room it has,
 * and an item too long for it wraps.
 */
function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  ...props
}: DropdownMenuContentProps) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "max-h-(--available-height) w-max max-w-(--available-width) min-w-[max(9rem,var(--anchor-width))] overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md outline-none",
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

/** A set of related items. A `DropdownMenuLabel` inside it names the set for a screen reader. */
function DropdownMenuGroup(props: MenuPrimitive.Group.Props) {
  return (
    <InGroupContext value>
      <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
    </InGroupContext>
  );
}

/** The Base UI Menu Group Label's props, plus `inset`. */
type DropdownMenuLabelProps = MenuPrimitive.GroupLabel.Props & {
  /** Lines the label up with items that have an icon. */
  inset?: boolean;
};

/**
 * A heading in the menu. Inside a `DropdownMenuGroup` or a `DropdownMenuRadioGroup` it names that
 * set. On its own it is words above the items and names nothing.
 *
 * Base UI's group label throws outside a group. shadcn's menus, such as the user menu of its
 * sidebar, put a label straight into the content, so that has to work here too.
 */
function DropdownMenuLabel({ className, inset, render, ...props }: DropdownMenuLabelProps) {
  const inGroup = useContext(InGroupContext);
  const shared = {
    "data-slot": "dropdown-menu-label",
    "data-inset": inset ? "" : undefined,
    className: cn(
      "px-control-x py-1 text-control-sm font-medium wrap-anywhere text-muted-foreground data-inset:pl-8",
      className,
    ),
  };
  if (inGroup) return <MenuPrimitive.GroupLabel {...shared} render={render} {...props} />;
  // A plain `div` takes everything a group label does, except a style worked out from state.
  const { style, ...rest } = props;
  return <div {...shared} {...rest} style={typeof style === "function" ? undefined : style} />;
}

/**
 * What every kind of item shares. An item is as high as a control, so it is a 44px target when
 * the density is comfortable, and its words wrap.
 */
const ITEM =
  "relative flex min-h-control w-full cursor-default items-center gap-control-gap rounded-sm py-1 pl-control-x text-control leading-snug wrap-anywhere outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-control-icon";

/** The Base UI Menu Item's props, plus `inset` and `variant`. */
type DropdownMenuItemProps = MenuPrimitive.Item.Props & {
  /** Lines the item up with items that have an icon. */
  inset?: boolean;
  /** `destructive` is for an action that stops, removes or cannot be undone. */
  variant?: "default" | "destructive";
};

/**
 * One action. A `destructive` item is in the critical colour, and its words must say what it
 * does: the colour adds to them and never stands in for them.
 */
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: DropdownMenuItemProps) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset ? "" : undefined}
      data-variant={variant}
      className={cn(
        "group/dropdown-menu-item",
        ITEM,
        "pr-control-x",
        "data-[variant=destructive]:text-critical-text data-[variant=destructive]:data-highlighted:bg-critical-subtle data-[variant=destructive]:data-highlighted:text-critical-text",
        className,
      )}
      {...props}
    />
  );
}

/** A menu that opens from an item of this one. */
const DropdownMenuSub = MenuPrimitive.SubmenuRoot;

/** The Base UI Submenu Trigger's props, plus `inset`. */
type DropdownMenuSubTriggerProps = MenuPrimitive.SubmenuTrigger.Props & {
  /** Lines the item up with items that have an icon. */
  inset?: boolean;
};

/** The item that opens a submenu. It carries a chevron, so it does not look like an action. */
function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: DropdownMenuSubTriggerProps) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset ? "" : undefined}
      className={cn(
        ITEM,
        "pr-2 data-popup-open:bg-accent data-popup-open:text-accent-foreground",
        className,
      )}
      {...props}
    >
      <span className="min-w-0 flex-1">{children}</span>
      <ChevronRight aria-hidden className="ml-auto rtl:rotate-180" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

/** The submenu. It opens beside its item. */
function DropdownMenuSubContent({
  align = "start",
  alignOffset = -5,
  side = "right",
  sideOffset = 0,
  className,
  ...props
}: DropdownMenuContentProps) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={cn("min-w-24 shadow-lg", className)}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

/** The tick of a checkbox or radio item, at the end of the item. */
function Indicator({ children, slot }: { children: ReactNode; slot: string }) {
  return (
    <span
      data-slot={slot}
      className="pointer-events-none absolute right-2 flex items-center justify-center"
    >
      {children}
    </span>
  );
}

/** The Base UI Menu Checkbox Item's props, plus `inset`. */
type DropdownMenuCheckboxItemProps = MenuPrimitive.CheckboxItem.Props & {
  /** Lines the item up with items that have an icon. */
  inset?: boolean;
};

/** An item that is on or off. When on it carries a tick, so its state does not rely on colour. */
function DropdownMenuCheckboxItem({
  className,
  children,
  inset,
  ...props
}: DropdownMenuCheckboxItemProps) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset ? "" : undefined}
      className={cn(ITEM, "pr-8", className)}
      {...props}
    >
      <Indicator slot="dropdown-menu-checkbox-item-indicator">
        <MenuPrimitive.CheckboxItemIndicator>
          <Check aria-hidden />
        </MenuPrimitive.CheckboxItemIndicator>
      </Indicator>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

/** A set of radio items, of which one is chosen. */
function DropdownMenuRadioGroup(props: MenuPrimitive.RadioGroup.Props) {
  return (
    <InGroupContext value>
      <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
    </InGroupContext>
  );
}

/** The Base UI Menu Radio Item's props, plus `inset`. */
type DropdownMenuRadioItemProps = MenuPrimitive.RadioItem.Props & {
  /** Lines the item up with items that have an icon. */
  inset?: boolean;
};

/** One of a set. The chosen one carries a tick. */
function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: DropdownMenuRadioItemProps) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset ? "" : undefined}
      className={cn(ITEM, "pr-8", className)}
      {...props}
    >
      <Indicator slot="dropdown-menu-radio-item-indicator">
        <MenuPrimitive.RadioItemIndicator>
          <Check aria-hidden />
        </MenuPrimitive.RadioItemIndicator>
      </Indicator>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

/** A rule between sets of items. */
function DropdownMenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

/**
 * The keys that do what the item does, shown at its end. It is a hint: the keys themselves are
 * yours to handle.
 */
function DropdownMenuShortcut({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto pl-4 text-control-sm whitespace-nowrap text-muted-foreground group-data-highlighted/dropdown-menu-item:text-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
export type {
  DropdownMenuCheckboxItemProps,
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuLabelProps,
  DropdownMenuRadioItemProps,
  DropdownMenuSubTriggerProps,
};
