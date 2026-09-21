import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Button } from "@/components/cadence/button";
import { Spinner } from "@/components/cadence/spinner";

const meta = {
  title: "Primitives/Spinner",
  component: Spinner,
  parameters: { layout: "padded", chromatic: { pauseAnimationAtEnd: true } },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("status", { name: "Loading" })).toBeVisible();
  },
};

export const NamedForTheUser: Story = {
  args: { "aria-label": "Loading results" },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("status", { name: "Loading results" }),
    ).toBeVisible();
  },
};

// Beside text that already says what is happening, the spinner is hidden from assistive
// technology, so the action is announced once.
export const InAPendingButton: Story = {
  render: () => (
    <Button disabled>
      <Spinner aria-hidden data-icon="inline-start" />
      Saving
    </Button>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Saving" })).toBeDisabled();
    await expect(canvas.queryByRole("status")).toBeNull();
  },
};

export const FollowsDensity: Story = {
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const spinner = within(canvasElement).getByRole("status", { name: "Loading" });
    await expect(spinner.getBoundingClientRect().width).toBe(20);
  },
};
