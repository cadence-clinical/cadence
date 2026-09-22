"use client";

import {
  AppShell,
  AppShellBody,
  AppShellContent,
  AppShellHeader,
  AppShellSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@cadence-clinical/ui";
import { CalendarClock, CalendarDays, Inbox, Mail } from "lucide-react";

// All content is synthetic.
const PAGES = [
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "appointments", label: "Appointments", icon: CalendarClock },
  { id: "referrals", label: "Referrals", icon: Inbox },
  { id: "letters", label: "Letters", icon: Mail },
];

/**
 * A live shell for the docs. The sidebar is fixed to the window, so the frame contains layout:
 * that makes the frame, not the window, what a fixed element is placed against. The frame's
 * height stands in for the window's.
 */
export function AppShellPreview() {
  return (
    <div className="not-prose preview-surface my-6 h-[28rem] overflow-hidden rounded-lg border [contain:layout]">
      <AppShell className="h-full min-h-0">
        <AppShellHeader>
          <span className="font-medium">Cadence Clinic</span>
        </AppShellHeader>
        <AppShellBody className="min-h-0">
          <AppShellSidebar collapsible="icon" className="md:h-[calc(100%-var(--header-height))]!">
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
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </AppShellSidebar>
          <AppShellContent className="overflow-auto">
            <div className="flex flex-col gap-container p-container text-body">
              <h2 className="text-title font-medium">Today</h2>
              <p>Four appointments are booked for this morning.</p>
            </div>
          </AppShellContent>
        </AppShellBody>
      </AppShell>
    </div>
  );
}
