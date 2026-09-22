import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/cadence/button";
import { Field, FieldGroup, FieldLabel } from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  type SheetContentProps,
} from "@/components/cadence/sheet";

// All content is synthetic.
function ContactSheet({ side, title = "Contact details" }: SheetContentProps & { title?: string }) {
  return (
    <>
      <SheetTrigger render={<Button variant="outline" />}>Edit contact details</SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Changes are saved to the record.</SheetDescription>
        </SheetHeader>
        <FieldGroup className="px-container">
          <Field>
            <FieldLabel>Phone</FieldLabel>
            <Input type="tel" defaultValue="0400 000 000" />
          </Field>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input type="email" defaultValue="alex.rivera@example.com" />
          </Field>
        </FieldGroup>
        <SheetFooter>
          <Button>Save</Button>
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
        </SheetFooter>
      </SheetContent>
    </>
  );
}

const meta = {
  title: "Composites/Sheet",
  component: Sheet,
  parameters: { layout: "padded" },
  args: { onOpenChange: fn() },
  render: (args) => (
    <Sheet {...args}>
      <ContactSheet />
    </Sheet>
  ),
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

// Closed, there is only the trigger to see, so the open sheet is the snapshot that matters.
export const Default: Story = { parameters: { chromatic: { disableSnapshot: true } } };

export const Open: Story = {
  args: { defaultOpen: true },
  play: async () => {
    const sheet = await screen.findByRole("dialog", { name: "Contact details" });
    await expect(sheet).toHaveAccessibleDescription("Changes are saved to the record.");
    await expect(sheet).toHaveAttribute("data-side", "right");
    await expect(within(sheet).getByRole("button", { name: "Close" })).toBeVisible();
  },
};

/** The sheet's edge against the window's, once it has finished sliding in. */
async function expectAgainst(side: "top" | "right" | "bottom" | "left") {
  const sheet = await screen.findByRole("dialog", { name: "Contact details" });
  await waitFor(
    async () => {
      const box = sheet.getBoundingClientRect();
      const edges = {
        top: box.top,
        left: box.left,
        right: window.innerWidth - box.right,
        bottom: window.innerHeight - box.bottom,
      };
      await expect(Math.abs(edges[side])).toBeLessThan(1);
    },
    { timeout: 5000 },
  );
}

export const FromTheLeft: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Sheet {...args}>
      <ContactSheet side="left" />
    </Sheet>
  ),
  play: async () => {
    await expectAgainst("left");
  },
};

export const FromTheTop: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Sheet {...args}>
      <ContactSheet side="top" />
    </Sheet>
  ),
  play: async () => {
    await expectAgainst("top");
  },
};

export const FromTheBottom: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Sheet {...args}>
      <ContactSheet side="bottom" />
    </Sheet>
  ),
  play: async () => {
    await expectAgainst("bottom");
  },
};

// Focus moves into the sheet, Escape closes it, and focus goes back to the trigger.
export const EscapeClosesAndFocusGoesBack: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ args, canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Edit contact details" });
    await userEvent.click(trigger);
    const sheet = await screen.findByRole("dialog", { name: "Contact details" });
    await waitFor(() => expect(sheet.contains(document.activeElement)).toBe(true));
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true, expect.anything());

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(), {
      timeout: 5000,
    });
    await expect(trigger).toHaveFocus();
  },
};

// A long title wraps short of the close button, and never runs under it.
export const ALongTitleClearsTheCloseButton: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Sheet {...args}>
      <ContactSheet title="Contact details for the person named on this referral" />
    </Sheet>
  ),
  play: async () => {
    const sheet = await screen.findByRole("dialog");
    const title = within(sheet).getByRole("heading");
    const close = within(sheet).getByRole("button", { name: "Close" });
    await expect(title.getBoundingClientRect().right).toBeLessThanOrEqual(
      close.getBoundingClientRect().left,
    );
  },
};

// With more than fits, the sheet scrolls inside itself, so its last button can be reached.
export const TallContentScrolls: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Sheet {...args}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Contact details</SheetTitle>
        </SheetHeader>
        <FieldGroup className="px-container">
          {Array.from({ length: 16 }, (_, index) => (
            <Field key={index}>
              <FieldLabel>{`Contact ${String(index + 1)}`}</FieldLabel>
              <Input />
            </Field>
          ))}
        </FieldGroup>
        <SheetFooter>
          <Button>Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  play: async () => {
    const sheet = await screen.findByRole("dialog");
    await expect(sheet.scrollHeight).toBeGreaterThan(sheet.clientHeight);
    const save = within(sheet).getByRole("button", { name: "Save" });
    save.scrollIntoView();
    await waitFor(() =>
      expect(save.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight),
    );
  },
};

/** The page's colour as <html> resolves it, whatever the canvas around the story paints. */
function pageColour() {
  const probe = document.createElement("div");
  probe.style.backgroundColor = "var(--background)";
  document.documentElement.append(probe);
  const colour = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return colour;
}

// Inside the sheet, a field fills with the sheet's colour, not the page's.
export const ControlsTakeTheSheetsColour: Story = {
  args: { defaultOpen: true },
  globals: { mode: "dark" },
  play: async () => {
    const fill = (element: Element) => getComputedStyle(element).backgroundColor;
    const sheet = await screen.findByRole("dialog");
    const phone = within(sheet).getByRole("textbox", { name: "Phone" });
    await waitFor(() => expect(fill(phone)).toBe(fill(sheet)));
    await expect(fill(sheet)).not.toBe(pageColour());
  },
};

export const FollowsComfortableDensity: Story = {
  args: { defaultOpen: true },
  globals: { density: "comfortable" },
  play: async () => {
    const sheet = await screen.findByRole("dialog");
    const header = sheet.querySelector("[data-slot=sheet-header]");
    if (!header) throw new Error("No header rendered.");
    await expect(getComputedStyle(header).paddingLeft).toBe("16px");
  },
};

// On a phone a side sheet takes three quarters of the width, and leaves the page in view.
export const OnAPhone: Story = {
  args: { defaultOpen: true },
  globals: { viewport: { value: "mobile1" } },
  parameters: { chromatic: { viewports: [320] } },
  play: async () => {
    const sheet = await screen.findByRole("dialog");
    await waitFor(() => expect(sheet.getBoundingClientRect().width).toBe(240), { timeout: 5000 });
  },
};
