"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { PanelLeft } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ComponentProps,
} from "react";

import { Button, type ButtonProps } from "@/components/cadence/button";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/cadence/dialog";
import { Input, type InputProps } from "@/components/cadence/input";
import { Separator, type SeparatorProps } from "@/components/cadence/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  type TooltipContentProps,
} from "@/components/cadence/tooltip";
import { cn } from "@/lib/cn";

// Base UI writes each key of `state` as a data attribute, which is how a part gets its
// `data-slot`, and a menu button its `data-size` and `data-active`.

/** The cookie that keeps the sidebar open or closed between visits, under shadcn's name. */
const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
/** With Ctrl or Cmd, toggles the sidebar. */
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
/** Below Tailwind's `md` breakpoint the sidebar is a sheet over the page. */
const MOBILE_QUERY = "(max-width: 767px)";

/**
 * Sizes that follow the density. An item's icon sits as far from its edge as from its top, so it
 * does not move when the sidebar collapses to icons, and the collapsed sidebar is one item wide.
 */
const SIDEBAR_VARS =
  "[--sidebar-item-inset:calc((var(--control-height)-var(--control-icon))/2)] [--sidebar-action:calc(var(--control-height)-0.75rem)]";

function subscribeToWidth(onChange: () => void) {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", onChange);
  return () => {
    query.removeEventListener("change", onChange);
  };
}

/** Whether the screen is narrow enough for the sheet. The server renders the wide layout. */
function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribeToWidth,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}

/** A key pressed in a field belongs to the field: Ctrl+B in a note is bold, not the sidebar. */
function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement)
  );
}

/** What `useSidebar` returns. */
interface SidebarContextValue {
  /** `expanded` or `collapsed`, as `data-state` on the sidebar. */
  state: "expanded" | "collapsed";
  /** Whether the sidebar is open on a wide screen. */
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Whether the sheet is open on a narrow screen. */
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  /** Whether the screen is narrow, so the sidebar is a sheet. */
  isMobile: boolean;
  /** Opens or closes the sidebar, or the sheet on a narrow screen. */
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

/** The sidebar's state and the functions that change it. Use it inside a `SidebarProvider`. */
function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

/** A `div`'s props, plus the open state, which can be controlled. */
type SidebarProviderProps = ComponentProps<"div"> & {
  /** Whether the sidebar starts open on a wide screen. */
  defaultOpen?: boolean;
  /** Whether the sidebar is open, when you control it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Holds the sidebar's state and lays out the sidebar beside the page. Wrap the whole layout in it:
 * the `Sidebar`, and the `SidebarInset` that holds the page.
 *
 * It remembers whether the sidebar is open in the `sidebar_state` cookie, and Ctrl+B or Cmd+B
 * toggles it, except while a field has focus. Tooltips inside share one delay.
 */
function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  className,
  children,
  ...props
}: SidebarProviderProps) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = useState(false);
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const open = openProp ?? ownOpen;

  const setOpen = useCallback(
    (value: boolean) => {
      setOwnOpen(value);
      onOpenChange?.(value);
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${String(value)}; path=/; max-age=${String(SIDEBAR_COOKIE_MAX_AGE)}; samesite=lax`;
    },
    [onOpenChange],
  );

  const toggleSidebar = useCallback(() => {
    if (isMobile) setOpenMobile((value) => !value);
    else setOpen(!open);
  }, [isMobile, open, setOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== SIDEBAR_KEYBOARD_SHORTCUT) return;
      if (!(event.metaKey || event.ctrlKey) || isEditable(event.target)) return;
      event.preventDefault();
      toggleSidebar();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [toggleSidebar]);

  const value = useMemo<SidebarContextValue>(
    () => ({
      state: open ? "expanded" : "collapsed",
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [open, setOpen, isMobile, openMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={value}>
      <TooltipProvider>
        <div
          data-slot="sidebar-wrapper"
          className={cn(
            "group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar",
            "[--sidebar-width-icon:calc(var(--control-height)+2*var(--container-padding-sm))] [--sidebar-width:16rem]",
            SIDEBAR_VARS,
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

/** A `div`'s props, plus where the sidebar sits, how it looks and how it collapses. */
type SidebarProps = ComponentProps<"div"> & {
  side?: "left" | "right";
  /** `sidebar` is flush with the edge, `floating` stands off it, `inset` frames the page. */
  variant?: "sidebar" | "floating" | "inset";
  /** `offcanvas` slides away, `icon` narrows to its icons, `none` stays open. */
  collapsible?: "offcanvas" | "icon" | "none";
};

/**
 * The sidebar. On a wide screen it sits beside the page and collapses as `collapsible` says. On a
 * narrow screen it is a sheet over the page, which holds focus until it is closed.
 *
 * Collapsed off the canvas, its contents are hidden from the keyboard and from screen readers,
 * not only moved out of sight.
 */
function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: SidebarProps) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Dialog open={openMobile} onOpenChange={setOpenMobile}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Popup
            data-slot="sidebar"
            data-sidebar="sidebar"
            data-mobile="true"
            data-side={side}
            className={cn(
              "fixed inset-y-0 z-50 flex h-full w-(--sidebar-width) max-w-[calc(100%-3rem)] flex-col bg-sidebar text-sidebar-foreground shadow-lg outline-none",
              "[--sidebar-width:18rem]",
              SIDEBAR_VARS,
              "data-[side=left]:left-0 data-[side=left]:border-r data-[side=right]:right-0 data-[side=right]:border-l",
              // It slides in from its edge. Tailwind sets `translate` as its own property.
              "transition-[translate] duration-200 ease-out-strong motion-reduce:transition-none",
              "data-[side=left]:data-ending-style:-translate-x-full data-[side=left]:data-starting-style:-translate-x-full",
              "data-[side=right]:data-ending-style:translate-x-full data-[side=right]:data-starting-style:translate-x-full",
              className,
            )}
          >
            <DialogTitle className="sr-only">Sidebar</DialogTitle>
            {children}
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>
    );
  }

  const framed = variant === "floating" || variant === "inset";

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* Holds the sidebar's room in the layout, so the page moves over as it collapses. */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-out-strong motion-reduce:transition-none",
          "group-data-[collapsible=offcanvas]:w-0 group-data-[side=right]:rotate-180",
          framed
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+2*var(--container-padding-sm))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
        )}
      />
      <div
        data-slot="sidebar-container"
        data-side={side}
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-out-strong motion-reduce:transition-none md:flex",
          "data-[side=left]:left-0 data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]",
          "data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          framed
            ? "p-container-sm group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+2*var(--container-padding-sm)+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className={cn(
            "flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm",
            // Off the canvas, the contents are hidden once the slide has finished, so the keyboard
            // and screen readers cannot reach links nobody can see. The rail stays, to reopen it.
            "transition-[visibility] duration-200 group-data-[collapsible=offcanvas]:invisible motion-reduce:transition-none",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** A Button's props. Its children are its name, which is hidden: the button shows an icon. */
type SidebarTriggerProps = ButtonProps;

/**
 * Opens and closes the sidebar, or the sheet on a narrow screen. It says which in
 * `aria-expanded`. Its name is "Toggle sidebar" unless you give it children.
 */
function SidebarTrigger({ className, onClick, children, ...props }: SidebarTriggerProps) {
  const { toggleSidebar, isMobile, open, openMobile } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="sm"
      iconOnly
      aria-expanded={isMobile ? openMobile : open}
      className={className}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft aria-hidden />
      {children ?? "Toggle sidebar"}
    </Button>
  );
}

/**
 * A thin strip along the sidebar's edge that toggles it when pressed, and shows a line on hover.
 * It is for a pointer only. The keyboard and screen readers use the `SidebarTrigger`, so the rail
 * is out of the tab order and hidden from assistive technology, where it would be a second
 * control with the trigger's name.
 */
function SidebarRail({ className, ...props }: ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-hidden
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle sidebar"
      className={cn(
        "visible absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "after:absolute after:inset-y-0 after:start-1/2 after:w-0.5 hover:after:bg-sidebar-border",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2 [[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The page beside the sidebar, as `main`. In the `inset` variant it is a rounded panel inside the
 * sidebar's colour.
 */
function SidebarInset({ className, ...props }: ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex w-full min-w-0 flex-1 flex-col bg-background",
        "md:peer-data-[variant=inset]:m-container-sm md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-lg md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-container-sm",
        className,
      )}
      {...props}
    />
  );
}

/**
 * An Input for the sidebar, such as a search field. Give it a label, as any field needs. Collapsed
 * to icons, there is no room for it, so it is hidden.
 */
function SidebarInput({ className, ...props }: InputProps) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("w-full group-data-[collapsible=icon]:hidden", className)}
      {...props}
    />
  );
}

/** The top of the sidebar, above what scrolls: a product or team switcher. */
function SidebarHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-container-sm p-container-sm", className)}
      {...props}
    />
  );
}

/** The bottom of the sidebar, below what scrolls: the signed-in user's menu. */
function SidebarFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-container-sm p-container-sm", className)}
      {...props}
    />
  );
}

/** A line between parts of the sidebar. */
function SidebarSeparator({ className, ...props }: SeparatorProps) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("mx-container-sm w-auto bg-sidebar-border", className)}
      {...props}
    />
  );
}

/**
 * The part of the sidebar that scrolls. It is a `nav` landmark, since a sidebar is how people find
 * their way round an application. If yours holds something else, pass `render={<div />}`, and name
 * the `nav` with `aria-label` when the page has another.
 */
function SidebarContent({ className, render, ...props }: useRender.ComponentProps<"nav">) {
  return useRender({
    defaultTagName: "nav",
    render,
    props: mergeProps<"nav">(
      {
        className: cn(
          "flex min-h-0 flex-1 flex-col overflow-auto group-data-[collapsible=icon]:overflow-hidden",
          className,
        ),
      },
      props,
    ),
    state: { slot: "sidebar-content", sidebar: "content" },
  });
}

/** A set of items, with a label above it. */
function SidebarGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-container-sm", className)}
      {...props}
    />
  );
}

/** The words above a group. Collapsed to icons, it fades away and gives up its room. */
function SidebarGroupLabel({ className, render, ...props }: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        className: cn(
          "flex h-control-sm shrink-0 items-center rounded-md px-(--sidebar-item-inset) text-control-sm font-medium text-muted-foreground",
          "ring-sidebar-ring outline-none focus-visible:ring-2 [&>svg]:size-control-icon [&>svg]:shrink-0",
          "transition-[margin,opacity] duration-200 ease-out-strong motion-reduce:transition-none",
          "group-data-[collapsible=icon]:-mt-control-sm group-data-[collapsible=icon]:opacity-0",
          className,
        ),
      },
      props,
    ),
    state: { slot: "sidebar-group-label", sidebar: "group-label" },
  });
}

/** A button beside a group's label, such as "Add". Give it a name. */
function SidebarGroupAction({ className, render, ...props }: useRender.ComponentProps<"button">) {
  return useRender({
    defaultTagName: "button",
    render,
    props: mergeProps<"button">(
      {
        type: render ? undefined : "button",
        className: cn(
          "absolute end-(--container-padding-sm) top-[calc(var(--container-padding-sm)+(var(--control-height-sm)-var(--sidebar-action))/2)] flex size-(--sidebar-action) items-center justify-center rounded-md text-sidebar-foreground",
          "ring-sidebar-ring outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2",
          "group-data-[collapsible=icon]:hidden [&>svg]:size-control-icon [&>svg]:shrink-0",
          // A larger target where there is no fine pointer.
          "after:absolute after:-inset-2 pointer-fine:after:hidden",
          className,
        ),
      },
      props,
    ),
    state: { slot: "sidebar-group-action", sidebar: "group-action" },
  });
}

/** What a group holds, under its label. */
function SidebarGroupContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-control", className)}
      {...props}
    />
  );
}

/** A list of items. */
function SidebarMenu({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-0.5", className)}
      {...props}
    />
  );
}

/** One item in the list. It holds a `SidebarMenuButton`, and an action or a badge beside it. */
function SidebarMenuItem({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}

/** A menu button's classes. */
const sidebarMenuButtonVariants = cva(
  [
    "peer/menu-button group/menu-button relative flex w-full items-center gap-control-gap overflow-hidden rounded-md px-(--sidebar-item-inset) py-1 text-left wrap-anywhere text-sidebar-foreground",
    "ring-sidebar-ring outline-none focus-visible:ring-2",
    "transition-[width,height,padding,background-color,color] duration-150 ease-out-strong motion-reduce:transition-none",
    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    // The item that is shown is filled, set in medium weight and marked with a bar at its start,
    // so it does not rely on the fill alone.
    "data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground",
    "before:absolute before:inset-y-1.5 before:start-0 before:w-[3px] before:rounded-full before:bg-primary-text before:opacity-0 data-active:before:opacity-100",
    // Room for an action or a badge at the end.
    "group-has-data-[sidebar=menu-action]/menu-item:pe-[calc(var(--sidebar-action)+0.5rem)] group-has-data-[sidebar=menu-badge]/menu-item:pe-[calc(var(--sidebar-action)+0.5rem)]",
    // Collapsed to icons, the item is a square and the label stays for its name. The gap after
    // the icon matches the inset before it, so the words begin exactly at the item's edge and none
    // of them shows.
    "group-data-[collapsible=icon]:size-control! group-data-[collapsible=icon]:gap-(--sidebar-item-inset) group-data-[collapsible=icon]:px-(--sidebar-item-inset)!",
    "[&_svg]:size-control-icon [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default: "",
        outline:
          "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:shadow-[0_0_0_1px_var(--sidebar-accent)]",
      },
      // Each size sets its own line height after its text size, so a page's taller one cannot
      // make the item taller than a control. It comes after the text size because cn() lets a
      // text size clear a line height set before it.
      size: {
        sm: "min-h-control-sm text-control-sm leading-snug",
        default: "min-h-control text-control leading-snug",
        lg: "min-h-[calc(var(--control-height)+1rem)] text-control leading-snug group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/** A button's props, or a link's through `render`, plus the size, the state and the tooltip. */
type SidebarMenuButtonProps = useRender.ComponentProps<"button"> &
  VariantProps<typeof sidebarMenuButtonVariants> & {
    /** Marks the item for the page that is shown: filled, a bar, and `aria-current="page"`. */
    isActive?: boolean;
    /** Shown beside the item when the sidebar is collapsed to icons. */
    tooltip?: string | TooltipContentProps;
  };

/**
 * An item's button, or its link through `render={<a href="..." />}`. Put an icon before its
 * words. A long label wraps: it is never cut off.
 *
 * Collapsed to icons, the words are out of sight but still name the item, and `tooltip` shows
 * them beside it.
 */
function SidebarMenuButton({
  render,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: SidebarMenuButtonProps) {
  const { isMobile, state } = useSidebar();
  const button = useRender({
    defaultTagName: "button",
    render: tooltip ? <TooltipTrigger render={render} /> : render,
    props: mergeProps<"button">(
      {
        type: render ? undefined : "button",
        "aria-current": isActive ? "page" : undefined,
        className: cn(sidebarMenuButtonVariants({ variant, size }), className),
      },
      props,
    ),
    state: { slot: "sidebar-menu-button", sidebar: "menu-button", size, active: isActive },
  });

  if (!tooltip) return button;

  const content = typeof tooltip === "string" ? { children: tooltip } : tooltip;
  return (
    <Tooltip disabled={state !== "collapsed" || isMobile}>
      {button}
      <TooltipContent side="right" align="center" {...content} />
    </Tooltip>
  );
}

/** A button's props, plus whether it shows only while its item is hovered or focused. */
type SidebarMenuActionProps = useRender.ComponentProps<"button"> & {
  /**
   * Hides the action until its item is hovered or focused. Only where there is a fine pointer: on
   * a touch screen, which cannot hover, it always shows.
   */
  showOnHover?: boolean;
};

/** A button at the end of an item, such as the trigger of its menu. Give it a name. */
function SidebarMenuAction({
  className,
  render,
  showOnHover = false,
  ...props
}: SidebarMenuActionProps) {
  return useRender({
    defaultTagName: "button",
    render,
    props: mergeProps<"button">(
      {
        type: render ? undefined : "button",
        className: cn(
          "absolute end-1 top-[calc((var(--control-height)-var(--sidebar-action))/2)] flex size-(--sidebar-action) items-center justify-center rounded-md text-sidebar-foreground",
          "peer-data-[size=lg]/menu-button:top-[calc((var(--control-height)+1rem-var(--sidebar-action))/2)] peer-data-[size=sm]/menu-button:top-[calc((var(--control-height-sm)-var(--sidebar-action))/2)]",
          "ring-sidebar-ring outline-none peer-hover/menu-button:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2",
          "group-data-[collapsible=icon]:hidden [&>svg]:size-control-icon [&>svg]:shrink-0",
          "after:absolute after:-inset-2 pointer-fine:after:hidden",
          // Each rule that shows it again sits in the same media query as the one that hides it, so
          // it is the more specific and wins.
          showOnHover &&
            "peer-data-active/menu-button:text-sidebar-accent-foreground pointer-fine:opacity-0 pointer-fine:group-focus-within/menu-item:opacity-100 pointer-fine:group-hover/menu-item:opacity-100 pointer-fine:aria-expanded:opacity-100 pointer-fine:data-popup-open:opacity-100",
          className,
        ),
      },
      props,
    ),
    state: { slot: "sidebar-menu-action", sidebar: "menu-action" },
  });
}

/** A count at the end of an item, such as how many results wait. */
function SidebarMenuBadge({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none absolute end-1 top-[calc((var(--control-height)-var(--sidebar-action))/2)] flex h-(--sidebar-action) min-w-(--sidebar-action) items-center justify-center rounded-md px-1 text-control-sm font-medium text-sidebar-foreground tabular-nums select-none",
        "peer-data-[size=lg]/menu-button:top-[calc((var(--control-height)+1rem-var(--sidebar-action))/2)] peer-data-[size=sm]/menu-button:top-[calc((var(--control-height-sm)-var(--sidebar-action))/2)]",
        "group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-active/menu-button:text-sidebar-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** A list of items under an item, drawn against a line below its icon. Hidden when collapsed. */
function SidebarMenuSub({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "ms-[calc(var(--sidebar-item-inset)+var(--control-icon)/2)] flex min-w-0 flex-col gap-0.5 border-s border-sidebar-border py-0.5 ps-(--sidebar-item-inset)",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

/** One item in a sub-list. */
function SidebarMenuSubItem({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  );
}

/** A link's props, plus the size and whether it is the page shown. */
type SidebarMenuSubButtonProps = useRender.ComponentProps<"a"> & {
  size?: "sm" | "md";
  /** Marks the item for the page that is shown: filled, a bar, and `aria-current="page"`. */
  isActive?: boolean;
};

/** A link in a sub-list. A long label wraps. */
function SidebarMenuSubButton({
  render,
  size = "md",
  isActive = false,
  className,
  ...props
}: SidebarMenuSubButtonProps) {
  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(
      {
        "aria-current": isActive ? "page" : undefined,
        className: cn(
          "relative flex min-h-control-sm min-w-0 items-center gap-control-gap rounded-md px-(--sidebar-item-inset) py-1 leading-snug wrap-anywhere text-sidebar-foreground",
          "ring-sidebar-ring outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2",
          "aria-disabled:pointer-events-none aria-disabled:opacity-50",
          "data-[size=md]:text-control data-[size=sm]:text-control-sm",
          "data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground",
          "before:absolute before:inset-y-1.5 before:start-0 before:w-[3px] before:rounded-full before:bg-primary-text before:opacity-0 data-active:before:opacity-100",
          "group-data-[collapsible=icon]:hidden [&>svg]:size-control-icon [&>svg]:shrink-0",
          className,
        ),
      },
      props,
    ),
    state: { slot: "sidebar-menu-sub-button", sidebar: "menu-sub-button", size, active: isActive },
  });
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  sidebarMenuButtonVariants,
  useSidebar,
};
export type {
  SidebarMenuActionProps,
  SidebarMenuButtonProps,
  SidebarMenuSubButtonProps,
  SidebarProps,
  SidebarProviderProps,
  SidebarTriggerProps,
};
