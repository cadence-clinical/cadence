import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check } from "lucide-react";
import { expect, waitFor, within } from "storybook/test";

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/cadence/avatar";

// All content is synthetic. The picture is a drawn pattern, not a photo of anyone.
const PATTERN = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#5b7fa6"/><circle cx="12" cy="14" r="9" fill="#9fb9d6"/><path d="M0 40 L22 18 L40 34 L40 40 Z" fill="#2f4a6b"/></svg>`,
)}`;

const meta = {
  title: "Primitives/Avatar",
  component: Avatar,
  parameters: { layout: "padded" },
  args: { children: <AvatarFallback>TE</AvatarFallback> },
  argTypes: { size: { control: "select", options: ["sm", "default", "lg"] } },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

// A clinician's initials, which is how most avatars in Cadence appear.
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("TE")).toBeVisible();
  },
};

// The picture shows once it has loaded, in place of the initials.
export const WithAPicture: Story = {
  args: {
    children: [
      <AvatarImage key="image" src={PATTERN} alt="Dr Tom Ellis" />,
      <AvatarFallback key="fallback">TE</AvatarFallback>,
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const image = await canvas.findByRole("img", { name: "Dr Tom Ellis" });
    await expect(image).toBeVisible();
    await waitFor(() => expect(canvas.queryByText("TE")).toBeNull());
  },
};

// A picture that does not load leaves the initials in its place.
export const APictureThatDoesNotLoad: Story = {
  args: {
    children: [
      <AvatarImage key="image" src="data:image/png;base64,broken" alt="Dr Tom Ellis" />,
      <AvatarFallback key="fallback">TE</AvatarFallback>,
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("TE")).toBeVisible();
    await expect(canvas.queryByRole("img")).toBeNull();
  },
};

const SIZES = { sm: 28, default: 32, lg: 36 } as const;

// Three sizes, each one of the control heights, so they follow the density.
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar size="sm">
        <AvatarFallback>TE</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>TE</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>TE</AvatarFallback>
      </Avatar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const sizes = [...canvasElement.querySelectorAll("[data-slot=avatar]")].map((avatar) =>
      Math.round(avatar.getBoundingClientRect().width),
    );
    await expect(sizes).toEqual([SIZES.sm, SIZES.default, SIZES.lg]);
  },
};

// Comfortable makes every size larger, with the controls beside it.
export const FollowsComfortableDensity: Story = {
  ...Sizes,
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const sizes = [...canvasElement.querySelectorAll("[data-slot=avatar]")].map((avatar) =>
      Math.round(avatar.getBoundingClientRect().width),
    );
    await expect(sizes).toEqual([36, 44, 48]);
  },
};

// A dot on the lower edge. Its meaning is said in words inside it, not by its colour alone.
export const WithABadge: Story = {
  args: {
    children: [
      <AvatarFallback key="fallback">TE</AvatarFallback>,
      <AvatarBadge key="badge">
        <Check aria-hidden />
        <span className="sr-only">On shift</span>
      </AvatarBadge>,
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("On shift")).toBeInTheDocument();
  },
};

// A team, overlapping, with a count of the people it does not show.
export const Group: Story = {
  render: () => (
    <AvatarGroup role="list" aria-label="GMU A team">
      {["TE", "AS", "MK"].map((initials) => (
        <Avatar key={initials} role="listitem">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      ))}
      <AvatarGroupCount role="listitem">
        +4<span className="sr-only"> more people</span>
      </AvatarGroupCount>
    </AvatarGroup>
  ),
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole("list", { name: "GMU A team" });
    const items = within(list).getAllByRole("listitem");
    await expect(items).toHaveLength(4);
    const [first, second] = items;
    if (!first || !second) throw new Error("The group has too few avatars.");
    // Each avatar overlaps the one before it.
    await expect(second.getBoundingClientRect().left).toBeLessThan(
      first.getBoundingClientRect().right,
    );
  },
};

export const InDarkMode: Story = { globals: { mode: "dark" } };
