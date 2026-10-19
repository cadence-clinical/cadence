import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleCheck, Clock, Eye, Minus, OctagonAlert } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Status } from "@/components/cadence/status";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/cadence/tooltip";

// All content is synthetic.
const meta = {
  title: "Primitives/Status",
  component: Status,
  parameters: { layout: "padded" },
  args: { tone: "success" },
  render: (args) => (
    <Status {...args}>
      <CircleCheck aria-hidden data-icon="inline-start" />
      Cleared
    </Status>
  ),
} satisfies Meta<typeof Status>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const status = within(canvasElement).getByText("Cleared");
    await expect(status).toHaveAttribute("data-slot", "status");
    await expect(status).toHaveAttribute("data-tone", "success");
  },
};

const STATES = [
  { tone: "neutral", icon: Minus, label: "Not needed" },
  { tone: "warning", icon: Clock, label: "Referred" },
  { tone: "info", icon: Eye, label: "Seen" },
  { tone: "success", icon: CircleCheck, label: "Cleared" },
  { tone: "critical", icon: OctagonAlert, label: "Declined" },
] as const;

function Tones() {
  return (
    <ul className="flex flex-col gap-2">
      {STATES.map(({ tone, icon: Icon, label }) => (
        <li key={tone}>
          <Status tone={tone}>
            <Icon aria-hidden data-icon="inline-start" />
            {label}
          </Status>
        </li>
      ))}
    </ul>
  );
}

// Each tone colours its icon. The words say the state, and each icon has its own shape, so no two
// states differ by colour alone.
export const AllTones: Story = {
  render: () => <Tones />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const colours = new Set<string>();
    for (const { label } of STATES) {
      const status = canvas.getByText(label);
      const icon = status.querySelector("svg");
      if (!icon) throw new Error(`No icon in ${label}`);
      colours.add(getComputedStyle(icon).color);
      // The words keep the colour around them.
      await expect(getComputedStyle(status).color).toBe(getComputedStyle(canvasElement).color);
    }
    await expect(colours.size).toBe(STATES.length);
  },
};

export const AllTonesComfortable: Story = {
  render: () => <Tones />,
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const icon = within(canvasElement).getByText("Cleared").querySelector("svg");
    await expect(icon?.getBoundingClientRect().width).toBeGreaterThan(16);
  },
};

// Short labels in a table cell: an abbreviation shows, and the state is in words for a screen
// reader and in a tooltip. One control per cell holds the tooltip, so it is one tab stop.
function Compact() {
  const parts = [
    { name: "PT", tone: "success", icon: CircleCheck, state: "cleared" },
    { name: "SW", tone: "warning", icon: Clock, state: "referred" },
    { name: "OT", tone: "neutral", icon: Minus, state: "not needed" },
  ] as const;
  const words = parts.map((part) => `${part.name} ${part.state}`).join(", ");
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={<button type="button" />}
          aria-label={`Allied health: ${words}`}
          className="inline-flex items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {parts.map(({ name, tone, icon: Icon }) => (
            <Status key={name} tone={tone}>
              {name}
              <Icon aria-hidden data-icon="inline-end" />
            </Status>
          ))}
        </TooltipTrigger>
        <TooltipContent>{words}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const AbbreviatedInATooltip: Story = {
  render: () => <Compact />,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", {
      name: "Allied health: PT cleared, SW referred, OT not needed",
    });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await waitFor(
      () =>
        expect(document.querySelector("[data-slot=tooltip-content]")).toHaveTextContent(
          "PT cleared, SW referred, OT not needed",
        ),
      { timeout: 5000 },
    );
  },
};

// On a phone a status keeps its words on one line beside its icon, and several wrap as whole
// units rather than breaking inside one.
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile1" } },
  parameters: { chromatic: { viewports: [320] } },
  render: () => (
    <p className="flex flex-wrap gap-x-3 gap-y-1">
      {STATES.map(({ tone, icon: Icon, label }) => (
        <Status key={tone} tone={tone} className="whitespace-nowrap">
          <Icon aria-hidden data-icon="inline-start" />
          {label}
        </Status>
      ))}
    </p>
  ),
  play: async ({ canvasElement }) => {
    const status = within(canvasElement).getByText("Not needed");
    // One line: no taller than its line height plus a pixel.
    await expect(status.getBoundingClientRect().height).toBeLessThan(28);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  },
};
