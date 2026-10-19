"use client";

import { createContext, useContext, useId, useMemo, type ComponentProps } from "react";

import { Separator } from "@/components/cadence/separator";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  type SidebarProps,
  type SidebarProviderProps,
} from "@/components/cadence/sidebar";
import { cn } from "@/lib/cn";

/** How the shell lays out its header and sidebar. */
type AppShellVariant = "header" | "inset";

interface AppShellContextValue {
  /** The id of the shell's main content, which the skip link moves focus to. */
  mainId: string;
  variant: AppShellVariant;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

/** The shell's layout. A header or a sidebar outside a shell keeps the `header` layout's look. */
function useAppShellVariant(): AppShellVariant {
  return useContext(AppShellContext)?.variant ?? "header";
}

/** The Sidebar provider's props, plus the layout. */
interface AppShellProps extends SidebarProviderProps {
  /**
   * `header` is shadcn's `sidebar-16`: a header across the top, and the sidebar under it. `inset`
   * is `sidebar-08`: the sidebar the full height of the window, and the header inside the page's
   * rounded panel beside it.
   */
  variant?: AppShellVariant;
}

/**
 * The frame of an application. It holds no content of its own: the sidebar's items, the header's
 * words and the page are yours.
 *
 * - `variant="header"`, the default, lays it out as shadcn's `sidebar-16` block: a header across
 *   the top, and below it a sidebar beside the page's content.
 * - `variant="inset"` lays it out as `sidebar-08`: an inset sidebar the full height of the window,
 *   and the page in a rounded panel beside it, with the header at the top of the panel. Put
 *   `AppShellHeader` inside `AppShellContent`. From `md` up the panel scrolls, not the window.
 *
 * It sets `--header-height` to the room the header takes from the window's height, so content
 * sized as the window less the header, such as a List and detail, fits without the page
 * scrolling. In the inset layout that includes the panel's margins.
 *
 * It starts with a link that skips to the content, which appears when it takes focus, so a
 * keyboard user does not have to pass the header and the sidebar on every page.
 */
function AppShell({ variant = "header", className, children, ...props }: AppShellProps) {
  const mainId = useId();
  const context = useMemo(() => ({ mainId, variant }), [mainId, variant]);
  return (
    <AppShellContext value={context}>
      <SidebarProvider
        data-slot="app-shell"
        data-variant={variant}
        className={cn(
          variant === "header"
            ? "flex-col [--header-height:calc(var(--control-height)+2*var(--container-padding-sm))]"
            : // The bar, and from md up the panel's margin above and below it.
              "[--header-height:calc(var(--control-height)+2*var(--container-padding-sm))] md:[--header-height:calc(var(--control-height)+4*var(--container-padding-sm))]",
          className,
        )}
        {...props}
      >
        <a
          data-slot="app-shell-skip-link"
          href={`#${mainId}`}
          // Focus moves without changing the address, which a router may read.
          onClick={(event) => {
            event.preventDefault();
            document.getElementById(mainId)?.focus();
          }}
          className={cn(
            "sr-only rounded-md bg-background px-control-x py-2 text-control font-medium text-foreground shadow-lg outline-none",
            "focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-60 focus:ring-2 focus:ring-ring",
          )}
        >
          Skip to content
        </a>
        {children}
      </SidebarProvider>
    </AppShellContext>
  );
}

/**
 * The bar at the top. It stays in view as the page scrolls, and it starts with the button that
 * opens and closes the sidebar, which on a phone is the only way to reach it.
 *
 * In the `header` layout it goes first, across the window. In the `inset` layout it goes first in
 * `AppShellContent`, across the top of the page's panel.
 */
function AppShellHeader({ className, children, ...props }: ComponentProps<"header">) {
  const variant = useAppShellVariant();
  return (
    <header
      data-slot="app-shell-header"
      className={cn(
        "sticky top-0 flex w-full shrink-0 items-center gap-2 border-b bg-background px-container",
        variant === "header"
          ? "z-50 h-(--header-height)"
          : // Inside the panel, so it takes the panel's rounded top corners.
            "z-10 h-[calc(var(--control-height)+2*var(--container-padding-sm))] md:rounded-t-lg",
        className,
      )}
      {...props}
    >
      <SidebarTrigger />
      <Separator
        orientation="vertical"
        className="data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
      />
      {children}
    </header>
  );
}

/** The row under the header: the sidebar and the content. */
function AppShellBody({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="app-shell-body" className={cn("flex flex-1", className)} {...props} />;
}

/**
 * The Sidebar. In the `header` layout it starts under the header rather than at the top of the
 * window. In the `inset` layout it is an inset Sidebar the full height of the window. On a phone
 * it is the Sidebar's sheet, over the whole screen.
 */
function AppShellSidebar({ className, ...props }: SidebarProps) {
  const variant = useAppShellVariant();
  if (variant === "inset") {
    return <Sidebar variant="inset" className={className} {...props} />;
  }
  return (
    <Sidebar
      className={cn(
        "md:top-(--header-height) md:h-[calc(100svh-var(--header-height))]!",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The page's content: the `main` landmark, which the skip link moves focus to. In the `inset`
 * layout it is the rounded panel, which from `md` up fills the window's height less its margins
 * and scrolls on its own, so the header at its top stays in view.
 */
function AppShellContent({ className, ...props }: ComponentProps<"main">) {
  const context = useContext(AppShellContext);
  if (context === null) throw new Error("AppShellContent must be used inside an AppShell.");
  const { mainId, variant } = context;
  return (
    <SidebarInset
      data-slot="app-shell-content"
      id={mainId}
      tabIndex={-1}
      className={cn(
        "outline-none",
        variant === "inset" &&
          "md:peer-data-[variant=inset]:h-[calc(100svh-2*var(--container-padding-sm))] md:peer-data-[variant=inset]:overflow-y-auto",
        className,
      )}
      {...props}
    />
  );
}

export { AppShell, AppShellBody, AppShellContent, AppShellHeader, AppShellSidebar };
export type { AppShellProps };
