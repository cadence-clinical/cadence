import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  CalendarClock,
  CalendarDays,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  Hospital,
  Inbox,
  LifeBuoy,
  LogOut,
  Mail,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";

import {
  AppShell,
  AppShellBody,
  AppShellContent,
  AppShellHeader,
  AppShellSidebar,
} from "@/components/cadence/app-shell";
import { Avatar, AvatarFallback } from "@/components/cadence/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/cadence/breadcrumb";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/cadence/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";
import { Input } from "@/components/cadence/input";
import { ListDetail, ListDetailDetail, ListDetailList } from "@/components/cadence/list-detail";
import {
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

const TEAM_LISTS = ["Admitting", "GMU A", "GMU B", "GMU C"];

/**
 * The inset layout, as shadcn's `sidebar-08`: an inset sidebar the full height of the window, and
 * the page in a rounded panel, with the header at the top of the panel.
 */
function InsetShell({ children }: { children: ReactNode }) {
  return (
    <AppShell variant="inset">
      <AppShellSidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" render={<a href="#home" />}>
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
                <SidebarMenuButton render={<a href="#my-patients" />}>
                  <ClipboardList aria-hidden />
                  <span>My patients</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <Collapsible defaultOpen render={<SidebarMenuItem />}>
                <SidebarMenuButton render={<a href="#team" />}>
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
                        <SidebarMenuSubButton isActive={list === "GMU A"} href="#team-list">
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
                  <SidebarMenuButton size="sm" render={<a href="#support" />}>
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
                    <span className="text-control-sm text-muted-foreground">Registrar · GMU A</span>
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
      <AppShellContent>
        <AppShellHeader>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:inline-flex">
                <BreadcrumbLink href="#lists">Lists</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:inline-flex" />
              <BreadcrumbItem className="hidden md:inline-flex">
                <BreadcrumbLink href="#team">Team</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:inline-flex" />
              <BreadcrumbItem>
                <BreadcrumbPage>GMU A</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </AppShellHeader>
        {children}
      </AppShellContent>
    </AppShell>
  );
}

const PATIENT_ROWS = Array.from({ length: 60 }, (_, index) => `Bed ${String(index + 1)}`);

/** A long page, so the panel has something to scroll. */
function LongPage() {
  return (
    <div className="flex flex-col gap-container p-container text-body">
      <h1 className="text-title font-medium">GMU A</h1>
      {PATIENT_ROWS.map((row) => (
        <p key={row}>{`${row}: synthetic patient, awaiting review.`}</p>
      ))}
    </div>
  );
}

/** A List and detail, which fills the panel under the header. */
function InsetListDetail() {
  return (
    <ListDetail>
      <ListDetailList aria-label="Patients">
        <ul className="flex flex-col gap-1 p-container-sm text-body">
          {PATIENT_ROWS.map((row) => (
            <li key={row}>
              <a href="#patient" className="block rounded-md p-container-sm hover:bg-muted">
                {row}
              </a>
            </li>
          ))}
        </ul>
      </ListDetailList>
      <ListDetailDetail aria-label="Patient">
        <p className="p-container text-body">No patient open.</p>
      </ListDetailDetail>
    </ListDetail>
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

/** The page's rounded panel: the main landmark. */
function panelOf(canvasElement: HTMLElement): HTMLElement {
  return within(canvasElement).getByRole("main");
}

/**
 * The inset layout's header. It is inside the main landmark, so it is the page's header, not the
 * banner.
 */
function headerOf(canvasElement: HTMLElement): HTMLElement {
  const header = canvasElement.querySelector("[data-slot=app-shell-header]");
  if (!(header instanceof HTMLElement)) throw new Error("No header rendered.");
  return header;
}

// The inset layout: the sidebar runs the full height of the window, and the header sits inside
// the page's panel, at its top, with the panel's margin around it.
export const Inset: Story = {
  render: () => (
    <InsetShell>
      <LongPage />
    </InsetShell>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = panelOf(canvasElement).getBoundingClientRect();
    const header = headerOf(canvasElement).getBoundingClientRect();
    const container = canvasElement.querySelector("[data-slot=sidebar-container]");
    if (!container) throw new Error("No sidebar rendered.");

    await expect(container.getBoundingClientRect().top).toBe(0);
    await expect(container.getBoundingClientRect().bottom).toBe(window.innerHeight);
    await expect(header.top).toBe(panel.top);
    await expect(header.left).toBe(panel.left);
    await expect(header.height).toBe(48);
    // The panel stands off the window by its margin, 8px when compact.
    await expect(panel.top).toBe(8);
    await expect(panel.bottom).toBe(window.innerHeight - 8);
    await expect(canvas.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
  },
};

// The panel scrolls, not the window, so the header at its top stays in view.
export const InsetTheHeaderStaysInView: Story = {
  ...Inset,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const panel = panelOf(canvasElement);
    const header = headerOf(canvasElement);
    await expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(window.innerHeight);
    panel.scrollTo(0, 400);
    await waitFor(() => expect(panel.scrollTop).toBeGreaterThan(0));
    await expect(header.getBoundingClientRect().top).toBe(panel.getBoundingClientRect().top);
  },
};

// A List and detail fills the panel under the header exactly, so neither the window nor the panel
// scrolls: each side scrolls on its own.
export const InsetWithAListAndDetail: Story = {
  render: () => (
    <InsetShell>
      <InsetListDetail />
    </InsetShell>
  ),
  play: async ({ canvasElement }) => {
    const panel = panelOf(canvasElement);
    const header = headerOf(canvasElement).getBoundingClientRect();
    const layout = canvasElement.querySelector("[data-slot=list-detail]");
    if (!layout) throw new Error("No layout rendered.");
    await expect(layout.getBoundingClientRect().top).toBe(header.bottom);
    await expect(layout.getBoundingClientRect().bottom).toBe(panel.getBoundingClientRect().bottom);
    await expect(panel.scrollHeight).toBeLessThanOrEqual(panel.clientHeight);
    await expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(window.innerHeight);
  },
};

// The same at comfortable density, where the header and the margins are larger.
export const InsetWithAListAndDetailComfortable: Story = {
  ...InsetWithAListAndDetail,
  globals: { density: "comfortable" },
};

// The skip link moves focus to the panel.
export const InsetSkipsToTheContent: Story = {
  ...Inset,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Skip to content" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(panelOf(canvasElement)).toHaveFocus());
  },
};

// On a phone the panel has no margin, the header stays at the top of the window, and its button
// opens the sidebar as a sheet.
export const InsetOnAPhone: Story = {
  ...Inset,
  globals: { viewport: { value: "mobile1" } },
  parameters: { chromatic: { viewports: [320] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = headerOf(canvasElement);
    await expect(header.getBoundingClientRect().top).toBe(0);
    await expect(header.getBoundingClientRect().left).toBe(0);
    await userEvent.click(canvas.getByRole("button", { name: "Toggle sidebar" }));
    const sheet = await screen.findByRole("dialog", { name: "Sidebar" });
    await expect(within(sheet).getByRole("navigation", { name: "Lists" })).toBeVisible();
  },
};

export const InsetInDarkMode: Story = { ...Inset, play: undefined, globals: { mode: "dark" } };
