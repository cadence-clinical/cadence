import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/cadence/button";
import { Checkbox } from "@/components/cadence/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/cadence/field";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/cadence/popover";

const outside = fn();

// All content is synthetic.
const meta = {
  title: "Composites/Popover",
  component: Popover,
  parameters: { layout: "padded" },
  args: { onOpenChange: fn() },
  render: (args) => (
    <div className="flex h-72 items-start gap-2">
      <Popover {...args}>
        <PopoverTrigger render={<Button variant="outline" />}>Filters</PopoverTrigger>
        <PopoverContent align="start">
          <PopoverHeader>
            <PopoverTitle>Filter appointments</PopoverTitle>
            <PopoverDescription>Show only the appointments that match.</PopoverDescription>
          </PopoverHeader>
          <FieldGroup>
            <Field orientation="horizontal">
              <Checkbox defaultChecked />
              <FieldLabel>Booked</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Checkbox />
              <FieldLabel>Cancelled</FieldLabel>
            </Field>
          </FieldGroup>
        </PopoverContent>
      </Popover>
      <Button variant="ghost" onClick={outside}>
        Refresh
      </Button>
    </div>
  ),
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

// Closed, there is only the trigger to see, so the open panel is the snapshot that matters.
export const Default: Story = { parameters: { chromatic: { disableSnapshot: true } } };

export const Open: Story = { args: { defaultOpen: true } };

function panel() {
  const element = document.querySelector("[data-slot=popover-content]");
  if (!(element instanceof HTMLElement)) throw new Error("The popover has not opened");
  return element;
}

/** The page's colour as <html> resolves it, whatever the canvas around the story paints. */
function pageColour() {
  const probe = document.createElement("div");
  probe.style.backgroundColor = "var(--background)";
  document.documentElement.append(probe);
  const colour = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return colour;
}

// A checkbox fills with the page colour, and inside the panel the panel is its page. In dark mode
// the two differ, so otherwise the box is a darker hole in the panel.
export const ControlsTakeThePanelsColour: Story = {
  args: { defaultOpen: true },
  globals: { mode: "dark" },
  play: async () => {
    const fill = (element: Element) => getComputedStyle(element).backgroundColor;
    const box = await waitFor(() => within(panel()).getByRole("checkbox", { name: "Cancelled" }));
    await waitFor(() => expect(fill(box)).toBe(fill(panel())));
    await expect(fill(panel())).not.toBe(pageColour());
  },
};

export const OpensNamedAndDescribed: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Filters" }));
    // The panel is rendered in a portal, outside the story's own element.
    const dialog = await screen.findByRole("dialog", { name: "Filter appointments" });
    await expect(dialog).toHaveAccessibleDescription("Show only the appointments that match.");
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true, expect.anything());

    // Opened with the pointer, it fades and grows. Base UI turns transitions off for the frame in
    // which the panel mounts, so wait for the settled value.
    await expect(panel()).not.toHaveAttribute("data-instant");
    await waitFor(() =>
      expect(getComputedStyle(panel()).transitionProperty.split(", ")).toEqual([
        "opacity",
        "scale",
      ]),
    );
  },
};

// From the keyboard the panel is simply there. An animation would only delay the next key.
export const OpensAtOnceFromTheKeyboard: Story = {
  play: async () => {
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await screen.findByRole("dialog");
    await waitFor(() => expect(panel()).toHaveAttribute("data-instant", "click"));
    await expect(getComputedStyle(panel()).transitionProperty).toBe("none");
    // Focus moves to the first control inside.
    await waitFor(() => expect(screen.getByRole("checkbox", { name: "Booked" })).toHaveFocus());
  },
};

export const EscapeClosesAndFocusGoesBack: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Filters" });
    await userEvent.click(trigger);
    await screen.findByRole("dialog");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

// A popover does not take over the page. A press on the page closes it, and the press still lands.
export const ThePageStaysInReach: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    outside.mockClear();
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Filters" }));
    await screen.findByRole("dialog");

    await userEvent.click(canvas.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(outside).toHaveBeenCalledOnce();
  },
};

// A popover does not hold focus. Tab goes past its last control to the page, and the panel closes.
export const TabLeavesThePanel: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(screen.getByRole("checkbox", { name: "Booked" })).toHaveFocus());

    await userEvent.tab();
    await expect(screen.getByRole("checkbox", { name: "Cancelled" })).toHaveFocus();
    await userEvent.tab();
    await waitFor(() =>
      expect(within(canvasElement).getByRole("button", { name: "Refresh" })).toHaveFocus(),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

// A panel with nothing inside to focus takes focus itself, and shows that it has.
export const TakesFocusWhenNothingInsideCan: Story = {
  render: (args) => (
    <div className="h-40">
      <Popover {...args}>
        <PopoverTrigger render={<Button variant="outline" />}>About this list</PopoverTrigger>
        <PopoverContent align="start">
          <PopoverTitle>About this list</PopoverTitle>
          <PopoverDescription>It updates each morning.</PopoverDescription>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async () => {
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await screen.findByRole("dialog");
    await waitFor(() => expect(panel()).toHaveFocus());
    await expect(getComputedStyle(panel()).boxShadow).toContain("0px 0px 0px 2px");
  },
};

const LONG = "SYNTHETIC" + "0".repeat(80);

export const LongWordsWrap: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <div className="h-72">
      <Popover {...args}>
        <PopoverTrigger render={<Button variant="outline" />}>Open</PopoverTrigger>
        <PopoverContent align="start">
          <PopoverTitle>{LONG}</PopoverTitle>
          <PopoverDescription>{LONG}</PopoverDescription>
          <div>{LONG}</div>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async () => {
    await screen.findByRole("dialog");
    await expect(panel().scrollWidth).toBeLessThanOrEqual(panel().clientWidth);
    await expect(panel().getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const OpenAndComfortable: Story = {
  args: { defaultOpen: true },
  globals: { density: "comfortable" },
  play: async () => {
    await screen.findByRole("dialog");
    await expect(getComputedStyle(panel()).paddingLeft).toBe("16px");
    await expect(getComputedStyle(panel()).fontSize).toBe("15px");
  },
};
