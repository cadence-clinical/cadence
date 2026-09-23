"use client";

import { createContext, useContext, useId, type ComponentProps } from "react";

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

/** The id of the shell's main content, which the skip link moves focus to. */
const AppShellContext = createContext<string | null>(null);

/**
 * The frame of an application, as shadcn's `sidebar-16` block lays it out: a header across the
 * top, and below it a sidebar beside the page's content. It holds no content of its own: the
 * sidebar's items, the header's words and the page are yours.
 *
 * It starts with a link that skips to the content, which appears when it takes focus, so a
 * keyboard user does not have to pass the header and the sidebar on every page.
 */
function AppShell({ className, children, ...props }: SidebarProviderProps) {
  const mainId = useId();
  return (
    <AppShellContext value={mainId}>
      <SidebarProvider
        data-slot="app-shell"
        className={cn(
          "flex-col [--header-height:calc(var(--control-height)+2*var(--container-padding-sm))]",
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
 * The bar across the top. It stays in view as the page scrolls, and it starts with the button that
 * opens and closes the sidebar, which on a phone is the only way to reach it.
 */
function AppShellHeader({ className, children, ...props }: ComponentProps<"header">) {
  return (
    <header
      data-slot="app-shell-header"
      className={cn(
        "sticky top-0 z-50 flex h-(--header-height) w-full shrink-0 items-center gap-2 border-b bg-background px-container",
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
 * The Sidebar, starting under the header rather than at the top of the window. On a phone it is
 * the Sidebar's sheet, over the whole screen.
 */
function AppShellSidebar({ className, ...props }: SidebarProps) {
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

/** The page's content: the `main` landmark, which the skip link moves focus to. */
function AppShellContent({ className, ...props }: ComponentProps<"main">) {
  const mainId = useContext(AppShellContext);
  if (mainId === null) throw new Error("AppShellContent must be used inside an AppShell.");
  return (
    <SidebarInset
      data-slot="app-shell-content"
      id={mainId}
      tabIndex={-1}
      className={cn("outline-none", className)}
      {...props}
    />
  );
}

export { AppShell, AppShellBody, AppShellContent, AppShellHeader, AppShellSidebar };
