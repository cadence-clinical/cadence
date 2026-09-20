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
    size: { control: "select", options: ["sm", "md", "lg", "icon"] },
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
      <Button {...args} variant="outline" size="icon" aria-label="Print chart">
        <Printer />
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
