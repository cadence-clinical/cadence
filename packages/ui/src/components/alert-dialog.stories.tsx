import type { Meta, StoryObj } from "@storybook/react-vite";
import { OctagonAlert } from "lucide-react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/cadence/alert-dialog";
import { Button } from "@/components/cadence/button";

const cease = fn();

// All content is synthetic.
const meta = {
  title: "Composites/AlertDialog",
  component: AlertDialog,
  parameters: { layout: "padded" },
  args: { onOpenChange: fn() },
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Cease medicine
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cease this medicine?</AlertDialogTitle>
          <AlertDialogDescription>
            It will be marked as ceased from today. The record of past doses is kept.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep medicine</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={cease}>
            Cease medicine
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Closed, there is only the trigger to see, so the open dialog is the snapshot that matters.
export const Default: Story = { parameters: { chromatic: { disableSnapshot: true } } };

export const Open: Story = { args: { defaultOpen: true } };

export const WithMedia: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Cease medicine
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <OctagonAlert aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle>Cease this medicine?</AlertDialogTitle>
          <AlertDialogDescription>It will be marked as ceased from today.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep medicine</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Cease medicine</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

// It is an alert dialog, named and described, and focus lands on the safe answer.
export const OpensOnTheSafeAnswer: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Cease medicine" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Cease this medicine?" });
    await expect(dialog).toHaveAccessibleDescription(/marked as ceased/);
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Keep medicine" })).toHaveFocus(),
    );
    // No close button in the corner: the answer is given in the footer.
    await expect(within(dialog).queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  },
};

// A press outside does nothing. The question has to be answered.
export const APressOutsideDoesNothing: Story = {
  args: { defaultOpen: true },
  play: async ({ args }) => {
    await screen.findByRole("alertdialog");
    const scrim = document.querySelector("[data-slot=dialog-overlay]");
    if (!(scrim instanceof HTMLElement)) throw new Error("No scrim");
    await userEvent.click(scrim);
    await expect(screen.getByRole("alertdialog")).toBeVisible();
    await expect(args.onOpenChange).not.toHaveBeenCalled();
  },
};

// Escape closes it and counts as cancelling: nothing is done.
export const EscapeCancels: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { defaultOpen: true },
  play: async ({ args }) => {
    cease.mockClear();
    await screen.findByRole("alertdialog");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    await expect(cease).not.toHaveBeenCalled();
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, expect.anything());
  },
};

// The action does the thing, then closes the dialog.
export const TheActionDoesTheThingAndCloses: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    cease.mockClear();
    const trigger = within(canvasElement).getByRole("button", { name: "Cease medicine" });
    await userEvent.click(trigger);
    const dialog = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Cease medicine" }));
    await expect(cease).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

// Enter on the answer that has focus is the safe one, so a reflex does not cease anything.
export const EnterKeepsTheMedicine: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { defaultOpen: true },
  play: async () => {
    cease.mockClear();
    const dialog = await screen.findByRole("alertdialog");
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Keep medicine" })).toHaveFocus(),
    );
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    await expect(cease).not.toHaveBeenCalled();
  },
};
