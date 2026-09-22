import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/cadence/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/cadence/drawer";
import { Field, FieldGroup, FieldLabel } from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";

// All content is synthetic.
function ContactDrawer({ fields = 2 }: { fields?: number }) {
  return (
    <>
      <DrawerTrigger render={<Button variant="outline" />}>Edit contact details</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Contact details</DrawerTitle>
          <DrawerDescription>Changes are saved to the record.</DrawerDescription>
        </DrawerHeader>
        <FieldGroup className="p-container">
          {Array.from({ length: fields }, (_, index) => (
            <Field key={index}>
              <FieldLabel>{index === 0 ? "Phone" : `Other phone ${String(index)}`}</FieldLabel>
              <Input type="tel" defaultValue={index === 0 ? "0400 000 000" : undefined} />
            </Field>
          ))}
        </FieldGroup>
        <DrawerFooter>
          <Button>Save</Button>
          <DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </>
  );
}

const meta = {
  title: "Composites/Drawer",
  component: Drawer,
  parameters: { layout: "padded" },
  args: { onOpenChange: fn(), showSwipeHandle: true },
  render: (args) => (
    <Drawer {...args}>
      <ContactDrawer />
    </Drawer>
  ),
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Closed, there is only the trigger to see, so the open drawer is the snapshot that matters.
export const Default: Story = { parameters: { chromatic: { disableSnapshot: true } } };

/** The drawer, once it has finished sliding in. */
async function openDrawer() {
  const drawer = await screen.findByRole("dialog", { name: "Contact details" });
  await waitFor(() => expect(drawer).not.toHaveAttribute("data-starting-style"), {
    timeout: 5000,
  });
  return drawer;
}

export const Open: Story = {
  args: { defaultOpen: true },
  play: async () => {
    const drawer = await openDrawer();
    await expect(drawer).toHaveAccessibleDescription("Changes are saved to the record.");
    // It rests against the bottom of the window.
    await waitFor(
      async () =>
        expect(Math.abs(window.innerHeight - drawer.getBoundingClientRect().bottom)).toBeLessThan(
          1,
        ),
      { timeout: 5000 },
    );
    // The handle shows it can be dragged, and says nothing to a screen reader.
    const handle = drawer.querySelector("[data-slot=drawer-swipe-handle]");
    await expect(handle).toHaveAttribute("aria-hidden", "true");
  },
};

// Focus moves into the drawer, Escape closes it, and focus goes back to the trigger.
export const EscapeClosesAndFocusGoesBack: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ args, canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Edit contact details" });
    await userEvent.click(trigger);
    const drawer = await openDrawer();
    await waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true));
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true, expect.anything());

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(), {
      timeout: 5000,
    });
    await expect(trigger).toHaveFocus();
  },
};

// A screen reader on a touch screen cannot swipe, so the drawer has a button that closes it.
export const CancelCloses: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { defaultOpen: true },
  play: async () => {
    const drawer = await openDrawer();
    await userEvent.click(within(drawer).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(), {
      timeout: 5000,
    });
  },
};

// A press on the page above it closes it.
export const PressingTheScrimClosesIt: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { defaultOpen: true },
  play: async () => {
    await openDrawer();
    const viewport = document.querySelector("[data-slot=drawer-viewport]");
    if (!viewport) throw new Error("No viewport rendered.");
    await userEvent.pointer({ keys: "[MouseLeft]", target: viewport, coords: { x: 20, y: 20 } });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(), {
      timeout: 5000,
    });
  },
};

export const FromTheRight: Story = {
  args: { defaultOpen: true, swipeDirection: "right" },
  play: async () => {
    const drawer = await openDrawer();
    await waitFor(
      async () =>
        expect(Math.abs(window.innerWidth - drawer.getBoundingClientRect().right)).toBeLessThan(1),
      { timeout: 5000 },
    );
  },
};

// With more than fits, the content scrolls inside the drawer, so its last button can be reached.
export const TallContentScrolls: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Drawer {...args}>
      <ContactDrawer fields={14} />
    </Drawer>
  ),
  play: async () => {
    const drawer = await openDrawer();
    const content = drawer.querySelector("[data-slot=drawer-content]");
    if (!content) throw new Error("No content rendered.");
    await expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    await expect(drawer.getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
    const cancel = within(drawer).getByRole("button", { name: "Cancel" });
    cancel.scrollIntoView();
    await waitFor(async () =>
      expect(cancel.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight),
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

// Inside the drawer, a field fills with the drawer's colour, not the page's.
export const ControlsTakeTheDrawersColour: Story = {
  args: { defaultOpen: true },
  globals: { mode: "dark" },
  play: async () => {
    const fill = (element: Element) => getComputedStyle(element).backgroundColor;
    const drawer = await openDrawer();
    const phone = within(drawer).getByRole("textbox", { name: "Phone" });
    await waitFor(async () => expect(fill(phone)).toBe(fill(drawer)));
    await expect(fill(drawer)).not.toBe(pageColour());
  },
};

export const FollowsComfortableDensity: Story = {
  args: { defaultOpen: true },
  globals: { density: "comfortable" },
  play: async () => {
    const drawer = await openDrawer();
    const header = drawer.querySelector("[data-slot=drawer-header]");
    if (!header) throw new Error("No header rendered.");
    await expect(getComputedStyle(header).paddingLeft).toBe("16px");
  },
};

// On a phone the drawer spans the width, and its title is centred.
export const OnAPhone: Story = {
  args: { defaultOpen: true },
  globals: { viewport: { value: "mobile1" } },
  parameters: { chromatic: { viewports: [320] } },
  play: async () => {
    const drawer = await openDrawer();
    await expect(drawer.getBoundingClientRect().width).toBe(window.innerWidth);
    const header = drawer.querySelector("[data-slot=drawer-header]");
    if (!header) throw new Error("No header rendered.");
    await expect(getComputedStyle(header).textAlign).toBe("center");
  },
};
