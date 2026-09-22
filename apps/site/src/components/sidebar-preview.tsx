"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@cadence-clinical/ui";
import { CalendarClock, CalendarDays, Hospital, Inbox, Mail } from "lucide-react";

// All content is synthetic.
const PAGES = [
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "appointments", label: "Appointments", icon: CalendarClock, count: 12 },
  { id: "referrals", label: "Referrals", icon: Inbox, count: 3 },
  { id: "letters", label: "Letters", icon: Mail },
];

/**
 * A live sidebar for the docs. The sidebar is fixed to the window, so the frame contains layout:
 * that makes the frame, not the window, what a fixed element is placed against.
 */
export function SidebarPreview() {
  return (
    <div className="not-prose preview-surface my-6 h-96 overflow-hidden rounded-lg border [contain:layout]">
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="icon" className="h-full">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" tooltip="Cadence Clinic">
                  <span className="flex size-control shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                    <Hospital aria-hidden />
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="font-medium">Cadence Clinic</span>
                    <span className="text-control-sm text-muted-foreground">Outpatients</span>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent aria-label="Clinic">
            <SidebarGroup>
              <SidebarGroupLabel>Clinic</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {PAGES.map((page) => (
                    <SidebarMenuItem key={page.id}>
                      <SidebarMenuButton isActive={page.id === "today"} tooltip={page.label}>
                        <page.icon aria-hidden />
                        <span>{page.label}</span>
                      </SidebarMenuButton>
                      {page.count === undefined ? null : (
                        <SidebarMenuBadge>{page.count}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-control-lg items-center gap-2 border-b px-container">
            <SidebarTrigger />
            <span className="text-title font-medium">Today</span>
          </header>
          <p className="p-container text-body">Four appointments are booked for this morning.</p>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
