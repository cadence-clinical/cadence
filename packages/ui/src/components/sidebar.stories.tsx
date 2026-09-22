import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  CalendarClock,
  CalendarDays,
  ChartColumn,
  ChevronsUpDown,
  Ellipsis,
  Hospital,
  Inbox,
  LogOut,
  Mail,
  Plus,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";
import { Separator } from "@/components/cadence/separator";
import {
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
  SidebarTrigger,
  type SidebarProps,
} from "@/components/cadence/sidebar";

// All content is synthetic.
interface Page {
  id: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

const PAGES: Page[] = [
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "appointments", label: "Appointments", icon: CalendarClock, count: 12 },
  { id: "referrals", label: "Referrals", icon: Inbox, count: 3 },
  { id: "letters", label: "Letters", icon: Mail },
];

const LISTS = ["Review this week", "Waiting for results"];

interface ClinicLayoutProps extends Pick<SidebarProps, "collapsible" | "side" | "variant"> {
  defaultOpen?: boolean;
  /** A page whose name is long, to show that it wraps. */
  longPage?: boolean;
}

function ClinicLayout({
  collapsible = "icon",
  side = "left",
  variant = "sidebar",
  defaultOpen = true,
  longPage = false,
}: ClinicLayoutProps) {
  const pages = longPage
    ? [
        ...PAGES,
        {
          id: "pre-admission",
          label: "Pre-admission clinic follow-up appointments",
          icon: Hospital,
        },
      ]
    : PAGES;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Sidebar collapsible={collapsible} side={side} variant={variant}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" tooltip="Cadence Clinic" render={<a href="#home" />}>
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
          <SidebarInput aria-label="Search the clinic" placeholder="Search" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Clinic</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {pages.map((page) => (
                  <SidebarMenuItem key={page.id}>
                    <SidebarMenuButton
                      isActive={page.id === "today"}
                      tooltip={page.label}
                      render={<a href={`#${page.id}`} />}
                    >
                      <page.icon aria-hidden />
                      <span>{page.label}</span>
                    </SidebarMenuButton>
                    {page.count === undefined ? null : (
                      <SidebarMenuBadge>{page.count}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Reports" render={<a href="#reports" />}>
                    <ChartColumn aria-hidden />
                    <span>Reports</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton href="#waiting-times">
                        Waiting times
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton href="#attendance">Attendance</SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {/* Its items have no icons, so it has nothing to show when collapsed to icons. */}
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Saved lists</SidebarGroupLabel>
            <SidebarGroupAction>
              <Plus aria-hidden />
              <span className="sr-only">Add a list</span>
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                {LISTS.map((list) => (
                  <SidebarMenuItem key={list}>
                    <SidebarMenuButton render={<a href="#list" />}>
                      <span>{list}</span>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<SidebarMenuAction showOnHover />}>
                        <Ellipsis aria-hidden />
                        <span className="sr-only">{`${list} actions`}</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start">
                        <DropdownMenuItem>Rename</DropdownMenuItem>
                        <DropdownMenuItem>Remove</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<SidebarMenuButton size="lg" tooltip="Your account" />}
                >
                  <span className="flex size-control shrink-0 items-center justify-center rounded-full bg-muted text-control-sm font-medium">
                    RG
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="font-medium">Registrar</span>
                    <span className="text-control-sm text-muted-foreground">General medicine</span>
                  </span>
                  <ChevronsUpDown aria-hidden className="ms-auto" />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Your account</DropdownMenuLabel>
                    <DropdownMenuItem>
                      <Settings aria-hidden />
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut aria-hidden />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-control-lg items-center gap-2 border-b px-container">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-control-sm" />
          <h1 className="text-title font-medium">Today</h1>
        </header>
        <div className="p-container text-body">
          <p>Four appointments are booked for this morning.</p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

const meta = {
  title: "Patterns/Sidebar",
  component: ClinicLayout,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ClinicLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The desktop sidebar, which carries the open state as `data-state`. */
function sidebarOf(canvasElement: HTMLElement): HTMLElement {
  const element = canvasElement.querySelector("[data-slot=sidebar]");
  if (!(element instanceof HTMLElement)) throw new Error("The sidebar did not render.");
  return element;
}

export const Default: Story = {};

export const Inset: Story = { args: { variant: "inset" } };

export const Floating: Story = { args: { variant: "floating" } };

export const OnTheRight: Story = { args: { side: "right" } };

export const InDarkMode: Story = { globals: { mode: "dark" } };

// The item for the page shown is filled, set in medium weight and marked with a bar, so the fill
// is not the only sign. It also says so to a screen reader.
export const TheShownItemIsMarkedByShape: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const shown = canvas.getByRole("link", { name: "Today" });
    const other = canvas.getByRole("link", { name: "Letters" });

    await expect(shown).toHaveAttribute("aria-current", "page");
    await expect(other).not.toHaveAttribute("aria-current");
    await expect(getComputedStyle(shown).fontWeight).toBe("500");

    const bar = (element: Element) => getComputedStyle(element, "::before");
    await expect(bar(shown).opacity).toBe("1");
    await expect(bar(shown).width).toBe("3px");
    await expect(bar(other).opacity).toBe("0");
  },
};

// The trigger opens and closes the sidebar, and says which it is.
export const TheTriggerSaysWhetherItIsOpen: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Toggle sidebar" });
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(sidebarOf(canvasElement)).toHaveAttribute("data-state", "collapsed");

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(sidebarOf(canvasElement)).toHaveAttribute("data-state", "expanded");
  },
};

// Ctrl+B toggles the sidebar, except in a field, where it is the field's key: bold, in a note.
export const TheShortcutLeavesFieldsAlone: Story = {
  play: async ({ canvasElement }) => {
    const sidebar = sidebarOf(canvasElement);

    await userEvent.keyboard("{Control>}b{/Control}");
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    await userEvent.keyboard("{Control>}b{/Control}");
    await expect(sidebar).toHaveAttribute("data-state", "expanded");

    await userEvent.click(
      within(canvasElement).getByRole("textbox", { name: "Search the clinic" }),
    );
    await userEvent.keyboard("{Control>}b{/Control}");
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
  },
};

// Collapsed to icons, each item is a square one control high, and keeps its words as its name.
// The words begin at the item's edge, so not a sliver of them shows beside the icon.
export const CollapsedToIcons: Story = {
  args: { defaultOpen: false },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: "Appointments" });
    await waitFor(async () => {
      const box = link.getBoundingClientRect();
      await expect(box.width).toBe(32);
      await expect(box.height).toBe(32);
    });
    const words = link.querySelector("span");
    if (!words) throw new Error("The link has no words.");
    await expect(words.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      link.getBoundingClientRect().right,
    );

    const container = canvasElement.querySelector("[data-slot=sidebar-container]");
    if (!container) throw new Error("The sidebar has no container.");
    await waitFor(() => expect(container.getBoundingClientRect().width).toBe(48));
  },
};

// Collapsed to icons, a tooltip names the icon a pointer rests on.
export const ATooltipNamesAnIcon: Story = {
  args: { defaultOpen: false },
  // The capture browser's hover timing is not reliable, and the end state is a tooltip.
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole("link", { name: "Referrals" }));
    await waitFor(
      () =>
        expect(
          screen.getByText("Referrals", { selector: "[data-slot=tooltip-content]" }),
        ).toBeVisible(),
      { timeout: 5000 },
    );
  },
};

// Slid off the canvas, the sidebar's links are out of reach of the keyboard and of screen
// readers, not only out of sight. The rail stays, to bring it back.
export const OffTheCanvasItsLinksAreOutOfReach: Story = {
  args: { collapsible: "offcanvas" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Letters" });
    await userEvent.click(canvas.getByRole("button", { name: "Toggle sidebar" }));

    const inner = canvasElement.querySelector("[data-slot=sidebar-inner]");
    if (!inner) throw new Error("The sidebar has no inner panel.");
    await waitFor(() => expect(getComputedStyle(inner).visibility).toBe("hidden"));
    link.focus();
    await expect(link).not.toHaveFocus();

    const rail = canvasElement.querySelector("[data-slot=sidebar-rail]");
    if (!rail) throw new Error("The sidebar has no rail.");
    await expect(getComputedStyle(rail).visibility).toBe("visible");
  },
};

// A long name wraps. It is never cut off.
export const ALongNameWraps: Story = {
  args: { longPage: true },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", {
      name: "Pre-admission clinic follow-up appointments",
    });
    await expect(link.getBoundingClientRect().height).toBeGreaterThan(32);
    const words = link.querySelector("span");
    if (!words) throw new Error("The link has no words.");
    await expect(words.scrollWidth).toBeLessThanOrEqual(words.clientWidth);
  },
};

// With a fine pointer, an item's action is out of sight until its item is hovered or has focus.
// On a touch screen, which cannot hover, it always shows. Storybook's synthetic events cannot
// produce :hover, so this checks the keyboard's way to it: focus on the item reveals the action.
export const AnActionShowsWhenItsItemHasFocus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const action = canvas.getByRole("button", { name: "Review this week actions" });
    await expect(getComputedStyle(action).opacity).toBe("0");

    canvas.getByRole("link", { name: "Review this week" }).focus();
    await waitFor(() => expect(getComputedStyle(action).opacity).toBe("1"));

    action.focus();
    await expect(getComputedStyle(action).opacity).toBe("1");
  },
};

// An item sets its own line height, so a page with a tall one, such as a docs page, cannot make
// it taller than a control.
export const KeepsItsHeightOnAPageWithTallLines: Story = {
  decorators: [
    (Story) => (
      <div className="leading-7">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: "Letters" });
    await expect(link.getBoundingClientRect().height).toBe(32);
  },
};

// Items are as high as a control, so they are 44px targets when the density is comfortable.
const followsDensity =
  (expected: { item: number; collapsed: number }) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: "Letters" }).getBoundingClientRect().height).toBe(
      expected.item,
    );

    await userEvent.click(canvas.getByRole("button", { name: "Toggle sidebar" }));
    const container = canvasElement.querySelector("[data-slot=sidebar-container]");
    if (!container) throw new Error("The sidebar has no container.");
    await waitFor(() => expect(container.getBoundingClientRect().width).toBe(expected.collapsed));
  };

export const FollowsCompactDensity: Story = {
  globals: { density: "compact" },
  play: followsDensity({ item: 32, collapsed: 48 }),
};

export const FollowsComfortableDensity: Story = {
  globals: { density: "comfortable" },
  play: followsDensity({ item: 44, collapsed: 68 }),
};

// On a phone the sidebar is a sheet over the page. It holds focus, and Escape closes it and
// returns focus to the trigger.
export const OnAPhoneItIsASheet: Story = {
  globals: { viewport: { value: "mobile1" } },
  parameters: { chromatic: { viewports: [320] } },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Toggle sidebar" });
    await expect(screen.queryByRole("dialog")).toBeNull();

    await userEvent.click(trigger);
    const sheet = await screen.findByRole("dialog", { name: "Sidebar" });
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(within(sheet).getByRole("link", { name: "Today" })).toBeVisible();
    await waitFor(() => expect(sheet.contains(document.activeElement)).toBe(true));

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};
