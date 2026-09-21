import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pencil, Printer } from "lucide-react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/cadence/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/cadence/tooltip";

const meta = {
  title: "Primitives/Tooltip",
  component: Tooltip,
  parameters: { layout: "centered" },
  render: (args) => (
    <div className="p-16">
      <Tooltip {...args}>
        <TooltipTrigger
          render={
            <Button variant="outline" iconOnly>
              <Printer />
              Print chart
            </Button>
          }
        />
        <TooltipContent>Print chart</TooltipContent>
      </Tooltip>
    </div>
  ),
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Open: Story = { args: { defaultOpen: true } };

// Base UI keeps one tooltip open at a time, so each side is its own story and its own snapshot.
const onSide = (side: "top" | "right" | "bottom" | "left"): Story => ({
  args: { defaultOpen: true },
  render: (args) => (
    <div className="p-24">
      <Tooltip {...args}>
        <TooltipTrigger render={<Button variant="outline">Print chart</Button>} />
        <TooltipContent side={side}>On the {side}</TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async () => {
    const hint = await screen.findByText(`On the ${side}`);
    await expect(hint).toHaveAttribute("data-side", side);
    // The arrow sits on the edge that faces the trigger.
    const arrow = hint.querySelector("[data-slot=tooltip-arrow]");
    if (!arrow) throw new Error("The tooltip has no arrow.");
    const [box, tip] = [hint.getBoundingClientRect(), arrow.getBoundingClientRect()];
    const centre = { x: tip.left + tip.width / 2, y: tip.top + tip.height / 2 };
    const edge = { top: box.bottom, bottom: box.top, left: box.right, right: box.left }[side];
    const distance = side === "top" || side === "bottom" ? centre.y - edge : centre.x - edge;
    await expect(Math.abs(distance)).toBeLessThanOrEqual(2);
  },
});

export const OnTop: Story = onSide("top");
export const OnTheRight: Story = onSide("right");
export const Below: Story = onSide("bottom");
export const OnTheLeft: Story = onSide("left");

// The trigger keeps its own name. The tooltip is a hint for someone who can hover or focus, and it
// is never announced, so the name cannot come from it.
export const OpensOnHoverAfterADelay: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Print chart" });

    await userEvent.hover(trigger);
    // It waits first, so a pointer that is only passing does not set it off.
    await expect(
      screen.queryByText("Print chart", { selector: "[data-slot=tooltip-content]" }),
    ).toBeNull();
    await waitFor(
      () =>
        expect(
          screen.getByText("Print chart", { selector: "[data-slot=tooltip-content]" }),
        ).toBeVisible(),
      { timeout: 3000 },
    );

    await userEvent.unhover(trigger);
    await waitFor(() =>
      expect(
        screen.queryByText("Print chart", { selector: "[data-slot=tooltip-content]" }),
      ).toBeNull(),
    );
  },
};

// From the keyboard it opens at once and without animation, and Escape closes it.
export const OpensOnFocusAtOnce: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Print chart" });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();

    const hint = await screen.findByText("Print chart", {
      selector: "[data-slot=tooltip-content]",
    });
    await expect(hint).toHaveAttribute("data-instant");
    // Nothing is left to transition, which is what stops the animation. The duration stays set.
    await expect(getComputedStyle(hint).transitionProperty).toBe("none");

    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        screen.queryByText("Print chart", { selector: "[data-slot=tooltip-content]" }),
      ).toBeNull(),
    );
    await expect(trigger).toHaveFocus();
  },
};

// Inside a provider the first tooltip waits and the next one does not, which is what makes a
// toolbar quick to explore.
export const TheNextOneOpensAtOnce: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex gap-2 p-16">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="outline" iconOnly>
                <Printer />
                Print chart
              </Button>
            }
          />
          <TooltipContent>Print</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="outline" iconOnly>
                <Pencil />
                Edit chart
              </Button>
            }
          />
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole("button", { name: "Print chart" }));
    await waitFor(() => expect(screen.getByText("Print")).toBeVisible(), { timeout: 3000 });

    await userEvent.hover(canvas.getByRole("button", { name: "Edit chart" }));
    const next = await screen.findByText("Edit", undefined, { timeout: 300 });
    await expect(next).toHaveAttribute("data-instant");
    await userEvent.unhover(canvas.getByRole("button", { name: "Edit chart" }));
  },
};

// A hint is not truncated either. It wraps inside its maximum width.
export const WrapsLongContent: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <div className="p-24">
      <Tooltip {...args}>
        <TooltipTrigger render={<Button variant="outline">Hint</Button>} />
        <TooltipContent>{"SYNTHETICHINT" + "0".repeat(60)}</TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async () => {
    const hint = await screen.findByText(/SYNTHETICHINT/);
    await expect(hint.getBoundingClientRect().width).toBeLessThanOrEqual(320);
    await expect(hint.scrollWidth).toBeLessThanOrEqual(hint.clientWidth);
    await expect(hint.getBoundingClientRect().height).toBeGreaterThan(30);
  },
};
