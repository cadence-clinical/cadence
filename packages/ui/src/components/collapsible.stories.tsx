import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown } from "lucide-react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/cadence/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/cadence/collapsible";

// All content is synthetic.
const ENTRIES = [
  "Seen in the Review clinic. No change to the plan.",
  "Letter sent to the referrer.",
  "Booked for the Review clinic in six weeks.",
];

const meta = {
  title: "Composites/Collapsible",
  component: Collapsible,
  parameters: { layout: "padded" },
  args: { onOpenChange: fn() },
  render: (args) => (
    <Collapsible {...args} className="flex max-w-sm flex-col gap-2">
      <CollapsibleTrigger render={<Button variant="ghost" size="sm" className="self-start" />}>
        Earlier entries
        <ChevronDown
          data-icon="inline-end"
          className="transition-[rotate] duration-150 ease-out-strong in-data-[panel-open]:rotate-180 motion-reduce:transition-none"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="flex flex-col gap-2 text-body">
          {ENTRIES.map((entry) => (
            <li key={entry} className="rounded-md border p-container-sm">
              {entry}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  ),
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

// Closed, the entries are out of the page, and the trigger says so.
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Earlier entries" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByText(ENTRIES[0] ?? "")).not.toBeInTheDocument();
  },
};

export const Open: Story = {
  args: { defaultOpen: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Earlier entries" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(canvas.getByText(ENTRIES[0] ?? "")).toBeVisible();
  },
};

// The trigger opens it and closes it again, and names the section it controls.
export const OpensAndCloses: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Earlier entries" });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true, expect.anything());
    const entry = await canvas.findByText(ENTRIES[0] ?? "");
    await expect(entry).toBeVisible();
    const panel = entry.closest("[data-slot=collapsible-content]");
    await expect(trigger).toHaveAttribute("aria-controls", panel?.id);

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(canvas.queryByText(ENTRIES[0] ?? "")).not.toBeInTheDocument(), {
      timeout: 5000,
    });
  },
};

export const ByKeyboard: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Earlier entries" });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard(" ");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};

// The section grows to its full height as it opens, and its icon turns.
export const GrowsToItsHeight: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Earlier entries" });
    await userEvent.click(trigger);
    const panel = (await canvas.findByText(ENTRIES[0] ?? "")).closest(
      "[data-slot=collapsible-content]",
    );
    const list = panel?.querySelector("ul");
    if (!panel || !list) throw new Error("The section did not open.");
    // Measured once it has stopped growing: the list itself does not move.
    await waitFor(
      () =>
        expect(panel.getBoundingClientRect().height).toBeCloseTo(
          list.getBoundingClientRect().height,
          0,
        ),
      { timeout: 5000 },
    );
    const icon = trigger.querySelector("svg");
    if (!icon) throw new Error("The trigger has no icon.");
    await waitFor(() => expect(getComputedStyle(icon).rotate).toBe("180deg"));
  },
};

// With `hiddenUntilFound`, a closed section stays in the page, so the browser's find can reach
// its words and open it.
export const FoundByTheBrowser: Story = {
  render: (args) => (
    <Collapsible {...args} className="flex max-w-sm flex-col gap-2">
      <CollapsibleTrigger render={<Button variant="ghost" size="sm" className="self-start" />}>
        Earlier entries
      </CollapsibleTrigger>
      <CollapsibleContent hiddenUntilFound>
        <p className="text-body">{ENTRIES[1]}</p>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement }) => {
    const words = within(canvasElement).getByText(ENTRIES[1] ?? "");
    await expect(words.closest("[data-slot=collapsible-content]")).toHaveAttribute(
      "hidden",
      "until-found",
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Earlier entries" });
    // It stays focusable, so it can be found, and says it is disabled.
    await expect(trigger).toHaveAttribute("aria-disabled", "true");
    trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};

export const InDarkMode: Story = { args: { defaultOpen: true }, globals: { mode: "dark" } };
