import type { Meta, StoryObj } from "@storybook/react-vite";
import { Clock } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";

import { Marker, MarkerContent, MarkerIcon } from "@/components/cadence/marker";

// All content is synthetic.
const meta = {
  title: "Primitives/Marker",
  component: Marker,
  parameters: { layout: "padded" },
  args: { className: "max-w-sm" },
  render: (args) => (
    <Marker {...args}>
      <MarkerIcon>
        <Clock />
      </MarkerIcon>
      <MarkerContent>Last updated at 09:40</MarkerContent>
    </Marker>
  ),
} satisfies Meta<typeof Marker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const marker = canvasElement.querySelector("[data-slot=marker]");
    if (!marker) throw new Error("No marker rendered.");
    await expect(marker).toHaveAttribute("data-variant", "default");
    // The icon is decoration. The words are what is read.
    await expect(canvasElement.querySelector("[data-slot=marker-icon]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(marker).toHaveTextContent("Last updated at 09:40");
  },
};

/** Two days of entries, each headed by a marker between rules. */
function Entries() {
  return (
    <div className="flex max-w-sm flex-col gap-3 text-body">
      <Marker variant="separator" render={<h3 />}>
        <MarkerContent>Today</MarkerContent>
      </Marker>
      <p>Seen in the Review clinic.</p>
      <Marker variant="separator" render={<h3 />}>
        <MarkerContent>Yesterday</MarkerContent>
      </Marker>
      <p>Letter sent to the referrer.</p>
    </div>
  );
}

// Heading the entries that follow it, it is rendered as a heading, so a screen reader can move
// from day to day.
export const BetweenTwoRules: Story = {
  render: () => <Entries />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Today",
      "Yesterday",
    ]);
    const marker = canvas.getByRole("heading", { name: "Today" });
    await expect(marker).toHaveAttribute("data-variant", "separator");
    await expect(getComputedStyle(marker, "::before").height).toBe("1px");
    await expect(getComputedStyle(marker, "::after").height).toBe("1px");
  },
};

export const WithARuleUnder: Story = {
  args: { variant: "border" },
  play: async ({ canvasElement }) => {
    const marker = canvasElement.querySelector("[data-slot=marker]");
    if (!marker) throw new Error("No marker rendered.");
    await expect(getComputedStyle(marker).borderBottomWidth).toBe("1px");
  },
};

// A link in the words is underlined, and shows where focus is.
export const WithALink: Story = {
  render: (args) => (
    <Marker {...args}>
      <MarkerContent>
        3 earlier entries. <a href="#earlier">Show them</a>
      </MarkerContent>
    </Marker>
  ),
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: "Show them" });
    await expect(getComputedStyle(link).textDecorationLine).toBe("underline");
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(getComputedStyle(link).boxShadow).not.toBe("none");
  },
};

// Rendered as a link, the whole marker is the link.
export const AsALink: Story = {
  render: (args) => (
    <Marker {...args} render={<a href="#earlier" />}>
      <MarkerContent>Show 3 earlier entries</MarkerContent>
    </Marker>
  ),
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: "Show 3 earlier entries" });
    await expect(getComputedStyle(link).textDecorationLine).toBe("underline");
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(getComputedStyle(link).boxShadow).not.toBe("none");
  },
};

// On a phone a long label wraps between its rules, and each rule keeps some length.
export const ALongLabelWraps: Story = {
  globals: { viewport: { value: "mobile1" } },
  parameters: { chromatic: { viewports: [320] } },
  render: () => (
    <Marker variant="separator">
      <MarkerContent>Entries recorded before the transfer to the Review clinic</MarkerContent>
    </Marker>
  ),
  play: async ({ canvasElement }) => {
    const marker = canvasElement.querySelector("[data-slot=marker]");
    const words = canvasElement.querySelector("[data-slot=marker-content]");
    if (!marker || !words) throw new Error("No marker rendered.");
    await expect(marker.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    // More than one line, so it wrapped.
    const lineHeight = parseFloat(getComputedStyle(words).lineHeight);
    await expect(words.getBoundingClientRect().height).toBeGreaterThan(lineHeight * 1.5);
    await expect(parseFloat(getComputedStyle(marker, "::before").width)).toBeGreaterThanOrEqual(16);
    await expect(parseFloat(getComputedStyle(marker, "::after").width)).toBeGreaterThanOrEqual(16);
  },
};

export const FollowsComfortableDensity: Story = {
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const marker = canvasElement.querySelector("[data-slot=marker]");
    const icon = canvasElement.querySelector("[data-slot=marker-icon] svg");
    if (!marker || !icon) throw new Error("No marker rendered.");
    await expect(getComputedStyle(marker).fontSize).toBe("15px");
    await expect(getComputedStyle(icon).width).toBe("20px");
  },
};

export const InDarkMode: Story = {
  globals: { mode: "dark" },
  render: () => <Entries />,
};
