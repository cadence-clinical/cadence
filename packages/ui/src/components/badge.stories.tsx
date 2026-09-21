import type { Meta, StoryObj } from "@storybook/react-vite";
import { TriangleAlert } from "lucide-react";
import { expect, within } from "storybook/test";

import { Badge } from "@/components/cadence/badge";

// All content is synthetic. A status badge shows a status it is given. It never works one out.
const meta = {
  title: "Primitives/Badge",
  component: Badge,
  parameters: { layout: "padded" },
  args: { children: "Draft" },
  argTypes: {
    variant: {
      control: "select",
      options: ["secondary", "primary", "outline", "critical", "warning", "success", "info"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Draft</Badge>
      <Badge variant="primary">New</Badge>
      <Badge variant="outline">Archived</Badge>
      <Badge>12</Badge>
    </div>
  ),
};

// The text says what the status is, because colour alone is not read by everyone, and each
// status surface carries its border, which is what gives an amber fill an edge on a white page.
export const Statuses: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="critical">
        <TriangleAlert aria-hidden />
        Critical
      </Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="success">Complete</Badge>
      <Badge variant="info">Information</Badge>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const name of ["Critical", "Warning", "Complete", "Information"]) {
      const style = getComputedStyle(within(canvasElement).getByText(name));
      await expect(style.borderTopWidth, name).toBe("1px");
      await expect(style.borderTopColor, name).not.toBe(style.backgroundColor);
      await expect(style.borderTopColor, name).not.toBe("rgba(0, 0, 0, 0)");
    }
  },
};

export const StatusesInDarkMode: Story = { ...Statuses, globals: { mode: "dark" } };

export const AsALink: Story = {
  render: () => (
    <Badge variant="outline" render={<a href="#results" />}>
      3 new results
    </Badge>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("link", { name: "3 new results" })).toBeVisible();
  },
};

// A badge that holds clinical text is never clipped or cut short. It wraps.
export const WrapsLongContent: Story = {
  render: () => (
    <div className="w-40 border p-2" data-testid="narrow">
      <Badge variant="info">{"SYNTHETICLABEL" + "0".repeat(40)}</Badge>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const container = within(canvasElement).getByTestId("narrow");
    await expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
    const badge = within(canvasElement).getByText(/SYNTHETICLABEL/);
    await expect(badge.scrollWidth).toBeLessThanOrEqual(badge.clientWidth);
    await expect(getComputedStyle(badge).overflow).toBe("visible");
  },
};
