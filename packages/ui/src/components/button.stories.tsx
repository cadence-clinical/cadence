import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, Plus, Printer } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Button } from "@/components/cadence/button";

const meta = {
  title: "Primitives/Button",
  component: Button,
  args: {
    children: "Save observation",
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "destructive", "link"],
    },
    size: { control: "select", options: ["sm", "md", "lg"] },
    iconOnly: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="destructive">
        Cease medication
      </Button>
      <Button {...args} variant="link">
        View history
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args}>
        <Plus data-icon="inline-start" />
        Add observation
      </Button>
      <Button {...args} variant="outline">
        Next chart
        <ArrowRight data-icon="inline-end" />
      </Button>
      <Button {...args} variant="link">
        Open history
        <ArrowRight data-icon="inline-end" />
      </Button>
      <Button {...args} variant="outline" iconOnly>
        <Printer />
        Print chart
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const padding = (name: string) => {
      const style = getComputedStyle(within(canvasElement).getByRole("button", { name }));
      return { start: parseFloat(style.paddingLeft), end: parseFloat(style.paddingRight) };
    };

    // The side that holds the icon is the tighter one.
    const leading = padding("Add observation");
    await expect(leading.start).toBeLessThan(leading.end);
    const trailing = padding("Next chart");
    await expect(trailing.end).toBeLessThan(trailing.start);
    // A link sits in running text and has no padding on either side.
    await expect(padding("Open history")).toEqual({ start: 0, end: 0 });
  },
};

// Icon-only is its own option, so it comes in every size. The label stays in the markup as the
// button's name and is only hidden from sight, so there is no aria-label to forget.
export const IconOnly: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="outline" size="sm" iconOnly>
        <Printer />
        Print small
      </Button>
      <Button {...args} variant="outline" size="md" iconOnly>
        <Printer />
        Print medium
      </Button>
      <Button {...args} variant="outline" size="lg" iconOnly>
        <Printer />
        Print large
      </Button>
      <Button {...args} variant="ghost" iconOnly>
        <Plus />
        Add observation
      </Button>
      <Button {...args} variant="destructive" iconOnly>
        <Plus className="rotate-45" />
        Remove observation
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heights: number[] = [];

    for (const name of ["Print small", "Print medium", "Print large"]) {
      const button = canvas.getByRole("button", { name });
      const box = button.getBoundingClientRect();
      // Square, with nothing spilling out of it.
      await expect(Math.round(box.width), name).toBe(Math.round(box.height));
      await expect(button.scrollWidth, name).toBeLessThanOrEqual(button.clientWidth);
      // The label is still there for a screen reader, and takes no room on screen.
      await expect(canvas.getByText(name).getBoundingClientRect().width).toBeLessThanOrEqual(1);
      heights.push(box.height);
    }

    await expect(heights).toEqual([...heights].sort((a, b) => a - b));
    await expect(new Set(heights).size).toBe(3);
  },
};

export const TextStepsWithSize: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const size = (name: string) =>
      parseFloat(getComputedStyle(within(canvasElement).getByRole("button", { name })).fontSize);

    await expect(size("Small")).toBeLessThan(size("Medium"));
    await expect(size("Medium")).toBeLessThan(size("Large"));
  },
};

// An icon follows the density, like the button it sits in.
export const IconFollowsDensity: Story = {
  globals: { density: "comfortable" },
  render: (args) => (
    <Button {...args} variant="outline" iconOnly>
      <Printer />
      Print chart
    </Button>
  ),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "Print chart" });
    await expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    const icon = button.querySelector("svg");
    if (!icon) throw new Error("The button has no icon.");
    await expect(icon.getBoundingClientRect().width).toBe(20);
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const ActivatesWithPointerAndKeyboard: Story = {
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "Save observation" });

    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);

    button.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    await expect(args.onClick).toHaveBeenCalledTimes(3);
  },
};

export const DoesNotActivateWhenDisabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "Save observation" });

    await expect(button).toBeDisabled();
    await userEvent.click(button, { pointerEventsCheck: 0 });
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const MeetsTouchTargetWhenComfortable: Story = {
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "Save observation" });
    await expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  },
};
