"use client";

import {
  AppShell,
  AppShellContent,
  AppShellHeader,
  AppShellSidebar,
  Avatar,
  AvatarFallback,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@cadence-clinical/ui";
import {
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  Hospital,
  LifeBuoy,
  LogOut,
  Users,
} from "lucide-react";

// All content is synthetic.
const TEAM_LISTS = ["Admitting", "GMU A", "GMU B", "GMU C"];

/**
 * A live inset shell for the docs, as shadcn's sidebar-08 lays it out. The sidebar is fixed to the
 * window, so the frame contains layout: that makes the frame, not the window, what a fixed element
 * is placed against. The frame's height stands in for the window's.
 */
export function AppShellInsetPreview() {
  return (
    <div className="not-prose preview-surface my-6 h-[28rem] overflow-hidden rounded-lg border [contain:layout]">
      <AppShell variant="inset" className="h-full min-h-0">
        <AppShellSidebar className="md:h-full!">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">
                  <span className="flex size-control shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                    <Hospital aria-hidden />
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="font-medium">Clinical App</span>
                    <span className="text-control-sm text-muted-foreground">Prototype</span>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent aria-label="Lists">
            <SidebarGroup>
              <SidebarGroupLabel>Lists</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <ClipboardList aria-hidden />
                    <span>My patients</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <Collapsible defaultOpen render={<SidebarMenuItem />}>
                  <SidebarMenuButton>
                    <Users aria-hidden />
                    <span>Team</span>
                  </SidebarMenuButton>
                  <CollapsibleTrigger
                    render={<SidebarMenuAction className="aria-expanded:rotate-90" />}
                  >
                    <ChevronRight aria-hidden />
                    <span className="sr-only">Team lists</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {TEAM_LISTS.map((list) => (
                        <SidebarMenuSubItem key={list}>
                          <SidebarMenuSubButton
                            isActive={list === "GMU A"}
                            href="#the-inset-layout"
                          >
                            {list}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton size="sm">
                      <LifeBuoy aria-hidden />
                      <span>Support</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
                    <Avatar aria-hidden>
                      <AvatarFallback>TE</AvatarFallback>
                    </Avatar>
                    <span className="flex flex-col leading-tight">
                      <span className="font-medium">Dr Tom Ellis</span>
                      <span className="text-control-sm text-muted-foreground">
                        Registrar · GMU A
                      </span>
                    </span>
                    <ChevronsUpDown aria-hidden className="ms-auto" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="end">
                    <DropdownMenuItem>
                      <LogOut aria-hidden />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </AppShellSidebar>
        <AppShellContent className="md:h-[calc(100%-2*var(--container-padding-sm))]!">
          <AppShellHeader>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:inline-flex">
                  <BreadcrumbLink href="#the-inset-layout">Lists</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:inline-flex" />
                <BreadcrumbItem className="hidden md:inline-flex">
                  <BreadcrumbLink href="#the-inset-layout">Team</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:inline-flex" />
                <BreadcrumbItem>
                  <BreadcrumbPage>GMU A</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </AppShellHeader>
          <div className="flex flex-col gap-container p-container text-body">
            <h2 className="text-title font-medium">GMU A</h2>
            <p>Twelve patients are on this list.</p>
          </div>
        </AppShellContent>
      </AppShell>
    </div>
  );
}
