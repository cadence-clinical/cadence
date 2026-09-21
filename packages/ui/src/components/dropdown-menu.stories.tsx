import type { Meta, StoryObj } from "@storybook/react-vite";
import { Ellipsis, Pencil, Printer, Trash2 } from "lucide-react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/cadence/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";

const edit = fn();
const remove = fn();

// All content is synthetic.
const meta = {
  title: "Composites/DropdownMenu",
  component: DropdownMenu,
  parameters: { layout: "padded" },
  args: { onOpenChange: fn() },
  render: (args) => (
    <div className="h-80">
      <DropdownMenu {...args}>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" iconOnly />}>
          <Ellipsis aria-hidden />
          Appointment actions
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Review clinic, Thursday</DropdownMenuLabel>
            <DropdownMenuItem onClick={edit}>
              <Pencil aria-hidden />
              Reschedule
              <DropdownMenuShortcut>R</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Printer aria-hidden />
              Print letter
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Printer aria-hidden />
              Print label
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={remove}>
            <Trash2 aria-hidden />
            Cancel appointment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

// Closed, there is only the trigger to see, so the open menu is the snapshot that matters.
export const Default: Story = { parameters: { chromatic: { disableSnapshot: true } } };

export const Open: Story = { args: { defaultOpen: true } };

function menu() {
  const element = document.querySelector("[data-slot=dropdown-menu-content]");
  if (!(element instanceof HTMLElement)) throw new Error("The menu has not opened");
  return element;
}

export const ActsWithThePointer: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    edit.mockClear();
    const trigger = within(canvasElement).getByRole("button", { name: "Appointment actions" });
    await userEvent.click(trigger);
    // The menu is rendered in a portal, outside the story's own element.
    await expect(await screen.findByRole("menu")).toBeVisible();
    // It opens at once, however it was opened.
    await expect(getComputedStyle(menu()).transitionDuration).toBe("0s");
    await expect(getComputedStyle(menu()).animationName).toBe("none");

    await userEvent.click(screen.getByRole("menuitem", { name: /Reschedule/ }));
    await expect(edit).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

// The arrow keys move through the items and skip nothing a person needs to hear about.
export const ActsWithTheKeyboard: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    edit.mockClear();
    const trigger = within(canvasElement).getByRole("button", { name: "Appointment actions" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await screen.findByRole("menu");

    // A test types faster than a person. Wait until the item has focus, not only its highlight:
    // a key goes to whatever has focus.
    const reschedule = screen.getByRole("menuitem", { name: /Reschedule/ });
    await waitFor(() => expect(reschedule).toHaveFocus());
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(edit).toHaveBeenCalledOnce());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const EscapeClosesAndFocusGoesBack: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Appointment actions" });
    await userEvent.click(trigger);
    await screen.findByRole("menu");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const ADisabledItemDoesNothing: Story = {
  args: { defaultOpen: true },
  play: async () => {
    await screen.findByRole("menu");
    await expect(screen.getByRole("menuitem", { name: "Print label" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  },
};

// The critical colour adds to the words and never stands in for them: the item says what it does.
export const ADestructiveItem: Story = {
  args: { defaultOpen: true },
  play: async () => {
    remove.mockClear();
    await screen.findByRole("menu");
    const item = screen.getByRole("menuitem", { name: "Cancel appointment" });
    const other = screen.getByRole("menuitem", { name: "Print letter" });
    await expect(getComputedStyle(item).color).not.toBe(getComputedStyle(other).color);
    await userEvent.click(item);
    await expect(remove).toHaveBeenCalledOnce();
  },
};

const columns = fn();

// A checked item carries a tick and a chosen one does too, so neither state relies on colour.
export const CheckboxAndRadioItems: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <div className="h-80">
      <DropdownMenu {...args}>
        <DropdownMenuTrigger render={<Button variant="outline" />}>View</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Columns</DropdownMenuLabel>
            <DropdownMenuCheckboxItem defaultChecked onCheckedChange={columns}>
              Clinic
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>Clinician</DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuRadioGroup defaultValue="date">
              <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="clinic">Clinic</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async () => {
    await screen.findByRole("menu");
    const clinic = screen.getByRole("menuitemcheckbox", { name: "Clinic" });
    const clinician = screen.getByRole("menuitemcheckbox", { name: "Clinician" });
    await expect(clinic).toBeChecked();
    await expect(clinic.querySelector("svg")).not.toBeNull();
    await expect(clinician.querySelector("svg")).toBeNull();

    await expect(screen.getByRole("menuitemradio", { name: "Date" })).toBeChecked();
    await expect(screen.getByRole("menuitemradio", { name: "Clinic" })).not.toBeChecked();
  },
};

export const ASubmenu: Story = {
  args: { defaultOpen: true },
  parameters: {
    a11y: {
      config: {
        // While a submenu is open, Base UI keeps two focus guards inside the parent menu, and in
        // Safari it gives them `role="button"` so that VoiceOver can use them. axe then reports
        // that a menu holds a button. They are Base UI's own, invisible and outside our control,
        // so this one rule is off for this one story. Every other rule still runs.
        rules: [{ id: "aria-required-children", enabled: false }],
      },
    },
  },
  render: (args) => (
    <div className="h-80">
      <DropdownMenu {...args}>
        <DropdownMenuTrigger render={<Button variant="outline" />}>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Reschedule</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Move to clinic</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>General clinic</DropdownMenuItem>
              <DropdownMenuItem>Review clinic</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async () => {
    await screen.findByRole("menu");
    const opener = screen.getByRole("menuitem", { name: "Move to clinic" });
    await expect(opener).toHaveAttribute("aria-haspopup", "menu");
    await userEvent.click(opener);
    await expect(await screen.findByRole("menuitem", { name: "Review clinic" })).toBeVisible();
  },
};

// shadcn's menus put a label straight into the content, where Base UI's group label throws.
export const ALabelOutsideAGroup: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <div className="h-60">
      <DropdownMenu {...args}>
        <DropdownMenuTrigger render={<Button variant="outline" />}>Account</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Signed in as a synthetic user</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async () => {
    await screen.findByRole("menu");
    await expect(screen.getByText("Signed in as a synthetic user")).toBeVisible();
  },
};

// Inside a group, the label is the group's name.
export const ALabelNamesItsGroup: Story = {
  args: { defaultOpen: true },
  play: async () => {
    await screen.findByRole("menu");
    await expect(screen.getByRole("group", { name: "Review clinic, Thursday" })).toBeVisible();
  },
};

const LONG = "SYNTHETIC" + "0".repeat(90);

// A long item wraps. The menu is never wider than the screen, and nothing is cut short.
export const LongItemsWrap: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <div className="h-80">
      <DropdownMenu {...args}>
        <DropdownMenuTrigger render={<Button variant="outline" />}>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{LONG}</DropdownMenuLabel>
          <DropdownMenuItem>{LONG}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async () => {
    await screen.findByRole("menu");
    await expect(menu().getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    await expect(menu().scrollWidth).toBeLessThanOrEqual(menu().clientWidth);
    const item = screen.getByRole("menuitem");
    await expect(item.scrollWidth).toBeLessThanOrEqual(item.clientWidth);
  },
};

export const MeetsTouchTargetWhenComfortable: Story = {
  args: { defaultOpen: true },
  globals: { density: "comfortable" },
  play: async () => {
    await screen.findByRole("menu");
    const item = screen.getByRole("menuitem", { name: /Reschedule/ });
    await expect(item.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  },
};
