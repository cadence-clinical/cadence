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

export const Open: Story = {
  args: { defaultOpen: true },
  play: async () => {
    // The growth is set with `scale`, a property of its own, so `scale` must be what transitions.
    // Transitioning `transform` animated the fade and let the growth snap.
    await waitFor(async () => {
      const popup = document.querySelector("[data-slot=tooltip-content]");
      if (!popup) throw new Error("The tooltip has not opened");
      await expect(getComputedStyle(popup).transitionProperty.split(", ")).toEqual([
        "opacity",
        "scale",
      ]);
    });
  },
};

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

// These three end with the tooltip closed, so there is nothing for a snapshot to show, and they
// depend on real focus that Chromatic's capture browser does not give. The component tests in CI
// run them in Chromium and WebKit.
const interactionOnly = { chromatic: { disableSnapshot: true } };

/**
 * How long a hover is given to open a tooltip. Base UI waits before the first one, and the
 * Storybook addon instruments every step, so a wait here says nothing about how quickly a person
 * sees the hint. What matters is which path Base UI took, which `data-instant` records.
 */
const OPENS = { timeout: 5000 } as const;

/**
 * The hint itself, once it is on screen: not the trigger's hidden text, which says the same
 * words. A hint fades in, and a fading element does not count as visible, so this waits for the
 * fade as well as the mount.
 */
const hint = (text: string) =>
  waitFor(async () => {
    const shown = screen.getByText(text, { selector: "[data-slot=tooltip-content]" });
    await expect(shown).toBeVisible();
    return shown;
  }, OPENS);

// The trigger keeps its own name. The tooltip is a hint for someone who can hover or focus, and it
// is never announced, so the name cannot come from it.
export const OpensOnHoverAfterADelay: Story = {
  parameters: interactionOnly,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Print chart" });
    // Nothing is shown until the pointer arrives, so a pointer only passing by sets nothing off.
    await expect(
      screen.queryByText("Print chart", { selector: "[data-slot=tooltip-content]" }),
    ).toBeNull();

    await userEvent.hover(trigger);
    // It waited: Base UI marks a hint that opened at once, and this one is not marked.
    const shown = await hint("Print chart");
    await expect(shown).not.toHaveAttribute("data-instant");

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
  parameters: interactionOnly,
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
  parameters: interactionOnly,
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
    await hint("Print");

    // The pointer moves to the next trigger without leaving the group, so Base UI opens the next
    // hint at once. It is marked, which is the claim: a clock here would only measure Storybook.
    await userEvent.hover(canvas.getByRole("button", { name: "Edit chart" }));
    await expect(await hint("Edit")).toHaveAttribute("data-instant");
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
