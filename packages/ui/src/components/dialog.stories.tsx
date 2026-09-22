import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/cadence/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/cadence/dialog";

// All content is synthetic.
const meta = {
  title: "Composites/Dialog",
  component: Dialog,
  parameters: { layout: "padded" },
  args: { onOpenChange: fn() },
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger render={<Button variant="outline" />}>Cancel appointment</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this appointment?</DialogTitle>
          <DialogDescription>
            The Review clinic appointment on Thursday will be cancelled. No letter is sent.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Keep appointment</DialogClose>
          <Button variant="destructive">Cancel appointment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Closed, there is only the trigger to see, so the open dialog is the snapshot that matters.
export const Default: Story = { parameters: { chromatic: { disableSnapshot: true } } };

export const Open: Story = { args: { defaultOpen: true } };

export const OpenAndComfortable: Story = {
  args: { defaultOpen: true },
  globals: { density: "comfortable" },
  play: async () => {
    const dialog = await screen.findByRole("dialog");
    await expect(getComputedStyle(dialog).paddingLeft).toBe("20px");
    const keep = within(dialog).getByRole("button", { name: "Keep appointment" });
    await expect(keep.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
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

// An outline button fills with the page colour, and inside the dialog the dialog is its page. In
// dark mode the two differ, so otherwise the button is a darker hole in the dialog.
export const ControlsTakeTheDialogsColour: Story = {
  args: { defaultOpen: true },
  globals: { mode: "dark" },
  play: async () => {
    const fill = (element: Element) => getComputedStyle(element).backgroundColor;
    const dialog = await screen.findByRole("dialog");
    const keep = within(dialog).getByRole("button", { name: "Keep appointment" });
    await waitFor(() => expect(fill(keep)).toBe(fill(dialog)));
    await expect(fill(dialog)).not.toBe(pageColour());
  },
};

export const OpensNamedAndDescribed: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Cancel appointment" }),
    );
    // The dialog is rendered in a portal, outside the story's own element.
    const dialog = await screen.findByRole("dialog", { name: "Cancel this appointment?" });
    await expect(dialog).toHaveAccessibleDescription(/will be cancelled/);
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true, expect.anything());
    // Focus moves into it.
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  },
};

export const EscapeClosesAndFocusGoesBack: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Cancel appointment" });
    await userEvent.click(trigger);
    await screen.findByRole("dialog");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const HoldsFocus: Story = {
  args: { defaultOpen: true },
  play: async () => {
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    // Three things take focus. Tabbing past the last comes round to the first, not to the page.
    // At each end Base UI catches focus on a guard outside the dialog and sends it back in, which
    // takes a frame, so each press waits for focus to settle.
    const held = new Set<Element>();
    for (let press = 0; press < 5; press += 1) {
      await userEvent.tab();
      await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
      if (document.activeElement) held.add(document.activeElement);
    }
    // Focus moved between the controls. It was not simply stuck on one.
    await expect(held.size).toBeGreaterThan(1);
  },
};

// The corner button shows only an icon, and is still called "Close".
export const ClosesFromTheCorner: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { defaultOpen: true },
  play: async () => {
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

// For a choice that must be made, a press outside does nothing. Escape still closes it.
export const StaysOpenOnAPressOutside: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { defaultOpen: true, disablePointerDismissal: true },
  play: async ({ args }) => {
    await screen.findByRole("dialog");
    const scrim = document.querySelector("[data-slot=dialog-overlay]");
    if (!(scrim instanceof HTMLElement)) throw new Error("No scrim");
    await expect(getComputedStyle(scrim).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");

    await userEvent.click(scrim);
    await expect(screen.getByRole("dialog")).toBeVisible();
    await expect(args.onOpenChange).not.toHaveBeenCalled();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

const LONG = "SYNTHETIC" + "0".repeat(70);

// A long title wraps, and stops short of the close button instead of running under it.
export const TheTitleClearsTheCloseButton: Story = {
  render: (args) => (
    <Dialog {...args} defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{LONG}</DialogTitle>
          <DialogDescription>{LONG}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  ),
  play: async () => {
    const dialog = await screen.findByRole("dialog");
    const title = within(dialog).getByRole("heading").getBoundingClientRect();
    const close = within(dialog).getByRole("button", { name: "Close" }).getBoundingClientRect();
    await expect(title.right).toBeLessThanOrEqual(close.left);
    await expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth);
  },
};

// A dialog is never taller than the screen. What does not fit scrolls inside it, so the last
// button can always be reached.
export const NeverTallerThanTheScreen: Story = {
  render: (args) => (
    <Dialog {...args} defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clinic terms of use</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          {Array.from({ length: 40 }, (_, index) => (
            <p key={index}>Paragraph {index + 1} of synthetic text that fills the dialog.</p>
          ))}
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  ),
  play: async () => {
    const dialog = await screen.findByRole("dialog");
    const box = dialog.getBoundingClientRect();
    await expect(box.top).toBeGreaterThanOrEqual(0);
    await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
    await expect(dialog.scrollHeight).toBeGreaterThan(dialog.clientHeight);

    const last = within(dialog).getAllByRole("button", { name: "Close" }).at(-1);
    last?.scrollIntoView();
    const button = last?.getBoundingClientRect();
    await expect(button?.bottom).toBeLessThanOrEqual(box.bottom);
  },
};
