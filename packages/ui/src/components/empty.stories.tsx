import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarX2 } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "@/components/cadence/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/cadence/empty";

// All content is synthetic.
const meta = {
  title: "Composites/Empty",
  component: Empty,
  parameters: { layout: "padded" },
  args: { className: "border" },
  render: (args) => (
    <Empty {...args}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CalendarX2 />
        </EmptyMedia>
        <EmptyTitle render={<h2 />}>No appointments today</EmptyTitle>
        <EmptyDescription>Appointments booked for today appear here.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>Book an appointment</Button>
      </EmptyContent>
    </Empty>
  ),
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof meta>;

// The title is a heading here, so a screen reader can find the panel's state from its outline.
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { level: 2, name: "No appointments today" }),
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Book an appointment" })).toBeVisible();
    // lucide marks its icons hidden, so the tile says nothing of its own.
    await expect(canvasElement.querySelector("[data-slot=empty-icon] svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  },
};

// Written as in shadcn, with a plain title and no border.
export const AsInShadcn: Story = {
  args: { className: undefined },
  render: (args) => (
    <Empty {...args}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CalendarX2 />
        </EmptyMedia>
        <EmptyTitle>No letters yet</EmptyTitle>
        <EmptyDescription>Letters sent from this clinic appear here.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
  play: async ({ canvasElement }) => {
    const title = canvasElement.querySelector("[data-slot=empty-title]");
    await expect(title?.tagName).toBe("DIV");
    await expect(title).toHaveTextContent("No letters yet");
  },
};

// A link in the description is underlined, and shows where focus is.
export const WithALink: Story = {
  render: (args) => (
    <Empty {...args}>
      <EmptyHeader>
        <EmptyTitle>No letters yet</EmptyTitle>
        <EmptyDescription>
          Letters sent from this clinic appear here. <a href="#templates">See the templates</a>.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: "See the templates" });
    await expect(getComputedStyle(link).textDecorationLine).toBe("underline");
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(getComputedStyle(link).boxShadow).not.toBe("none");
  },
};

export const FollowsComfortableDensity: Story = {
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const empty = canvasElement.querySelector("[data-slot=empty]");
    const media = canvasElement.querySelector("[data-slot=empty-icon]");
    if (!empty || !media) throw new Error("Nothing rendered.");
    await expect(getComputedStyle(empty).paddingTop).toBe("32px");
    await expect(getComputedStyle(media).width).toBe("44px");
  },
};

// On a phone the words wrap and nothing runs off the screen.
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile1" } },
  parameters: { chromatic: { viewports: [320] } },
  play: async ({ canvasElement }) => {
    const empty = canvasElement.querySelector("[data-slot=empty]");
    if (!empty) throw new Error("Nothing rendered.");
    await expect(empty.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const InDarkMode: Story = { globals: { mode: "dark" } };
