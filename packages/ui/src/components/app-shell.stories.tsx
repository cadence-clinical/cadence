import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarClock, CalendarDays, Inbox, Mail } from "lucide-react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";

import {
  AppShell,
  AppShellBody,
  AppShellContent,
  AppShellHeader,
  AppShellSidebar,
} from "@/components/cadence/app-shell";
import { Input } from "@/components/cadence/input";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/cadence/sidebar";

// All content is synthetic.
const PAGES = [
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "appointments", label: "Appointments", icon: CalendarClock },
  { id: "referrals", label: "Referrals", icon: Inbox },
  { id: "letters", label: "Letters", icon: Mail },
];

/** A clinic's frame: its name and a search in the header, its pages in the sidebar. */
function ClinicShell() {
  return (
    <AppShell>
      <AppShellHeader>
        <span className="font-medium">Cadence Clinic</span>
        <Input aria-label="Search appointments" className="ml-auto hidden max-w-56 sm:flex" />
      </AppShellHeader>
      <AppShellBody>
        <AppShellSidebar collapsible="icon">
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
        <AppShellContent>
          <div className="flex flex-col gap-container p-container text-body">
            <h1 className="text-title font-medium">Today</h1>
            {Array.from({ length: 60 }, (_, index) => (
              <p key={index}>{`Appointment ${String(index + 1)}: Review clinic, room 4.`}</p>
            ))}
          </div>
        </AppShellContent>
      </AppShellBody>
    </AppShell>
  );
}

const meta = {
  title: "Layouts/Application shell",
  component: AppShell,
  parameters: { layout: "fullscreen" },
  render: () => <ClinicShell />,
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

// The frame gives the page its landmarks: a banner, the navigation and the main content.
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("banner")).toBeVisible();
    await expect(canvas.getByRole("navigation", { name: "Clinic" })).toBeVisible();
    await expect(canvas.getByRole("main")).toBeVisible();
  },
};

// The first Tab shows a link that skips the header and the sidebar, and it moves focus to the
// content.
export const SkipsToTheContent: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    const skip = canvas.getByRole("link", { name: "Skip to content" });
    await expect(skip).toHaveFocus();
    await expect(skip.getBoundingClientRect().width).toBeGreaterThan(40);
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(canvas.getByRole("main")).toHaveFocus());
  },
};

// The rule between the button and the header's words is centred in the header.
export const TheHeadersRuleIsCentred: Story = {
  play: async ({ canvasElement }) => {
    const header = within(canvasElement).getByRole("banner");
    const rule = header.querySelector("[data-slot=separator]");
    if (!rule) throw new Error("No rule rendered.");
    const headerBox = header.getBoundingClientRect();
    const ruleBox = rule.getBoundingClientRect();
    const middle = (box: DOMRect) => box.top + box.height / 2;
    // The header's border is at its bottom, so its middle is half a pixel above its box's.
    await expect(Math.abs(middle(ruleBox) - middle(headerBox))).toBeLessThanOrEqual(1);
  },
};

// The sidebar starts under the header, not at the top of the window.
export const TheSidebarSitsUnderTheHeader: Story = {
  play: async ({ canvasElement }) => {
    const header = within(canvasElement).getByRole("banner");
    const container = canvasElement.querySelector("[data-slot=sidebar-container]");
    if (!container) throw new Error("No sidebar rendered.");
    const bottom = header.getBoundingClientRect().bottom;
    await expect(header.getBoundingClientRect().height).toBe(48);
    await expect(container.getBoundingClientRect().top).toBe(bottom);
    await expect(container.getBoundingClientRect().bottom).toBe(window.innerHeight);
  },
};

// The header stays in view as the page scrolls.
export const TheHeaderStaysInView: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const header = within(canvasElement).getByRole("banner");
    window.scrollTo(0, 400);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(0));
    await expect(header.getBoundingClientRect().top).toBe(0);
    window.scrollTo(0, 0);
  },
};

// The button in the header folds the sidebar to its icons, and opens it again.
export const TheHeaderFoldsTheSidebar: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Toggle sidebar" });
    const sidebar = canvasElement.querySelector("[data-slot=sidebar]");
    await userEvent.click(toggle);
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
  },
};

// On a phone the header's button opens the sidebar as a sheet over the whole screen.
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile1" } },
  parameters: { chromatic: { viewports: [320] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Toggle sidebar" }));
    const sheet = await screen.findByRole("dialog", { name: "Sidebar" });
    await waitFor(() => expect(sheet.getBoundingClientRect().top).toBe(0), { timeout: 5000 });
    await expect(within(sheet).getByRole("navigation", { name: "Clinic" })).toBeVisible();
  },
};

export const FollowsComfortableDensity: Story = {
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const header = within(canvasElement).getByRole("banner");
    await expect(header.getBoundingClientRect().height).toBe(68);
  },
};

export const InDarkMode: Story = { globals: { mode: "dark" } };
