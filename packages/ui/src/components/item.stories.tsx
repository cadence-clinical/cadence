import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarDays, ChevronRight } from "lucide-react";
import { expect, within } from "storybook/test";

import { Badge } from "@/components/cadence/badge";
import { Button } from "@/components/cadence/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/cadence/item";

// All content is synthetic.
const meta = {
  title: "Composites/Item",
  component: Item,
  parameters: { layout: "padded" },
  argTypes: {
    variant: { control: "select", options: ["plain", "outline", "muted"] },
    size: { control: "select", options: ["sm", "md"] },
  },
  render: (args) => (
    <Item {...args} className="max-w-md">
      <ItemMedia variant="icon">
        <CalendarDays aria-hidden />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Review clinic</ItemTitle>
        <ItemDescription>Thursday at 10:15. Outpatients, Level 2.</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="outline" size="sm">
          Reschedule
        </Button>
      </ItemActions>
    </Item>
  ),
} satisfies Meta<typeof Item>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { variant: "outline" } };

export const Variants: Story = {
  render: () => (
    <div className="grid max-w-md gap-3">
      {(["plain", "outline", "muted"] as const).map((variant) => (
        <Item key={variant} variant={variant}>
          <ItemContent>
            <ItemTitle>Review clinic</ItemTitle>
            <ItemDescription>The {variant} variant.</ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </div>
  ),
};

export const Small: Story = { args: { variant: "outline", size: "sm" } };

export const WithABadge: Story = {
  render: () => (
    <Item variant="outline" className="max-w-md">
      <ItemContent>
        <ItemTitle>
          Review clinic
          <Badge variant="info">Rescheduled</Badge>
        </ItemTitle>
        <ItemDescription>Thursday at 10:15. Outpatients, Level 2.</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

// A set of items is usually a list. The group and the items take that meaning through `render`,
// which keeps the markup valid: a list role with no list items in it is not. A `ul` may hold only
// `li` elements, so `divided` draws the lines between them as borders, not separators.
export const AsAList: Story = {
  render: () => (
    <ItemGroup
      divided
      render={<ul aria-label="Appointments" />}
      className="max-w-md rounded-lg border"
    >
      <Item render={<li />}>
        <ItemContent>
          <ItemTitle>General clinic</ItemTitle>
          <ItemDescription>Monday at 08:30</ItemDescription>
        </ItemContent>
      </Item>
      <Item render={<li />}>
        <ItemContent>
          <ItemTitle>Review clinic</ItemTitle>
          <ItemDescription>Thursday at 10:15</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole("list", { name: "Appointments" });
    const [first, second] = within(list).getAllByRole("listitem");
    if (!first || !second) throw new Error("The list needs two items.");

    // The line is the second item's top border, in a colour that can be seen.
    await expect(getComputedStyle(first).borderTopColor).toBe("rgba(0, 0, 0, 0)");
    await expect(getComputedStyle(second).borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
    await expect(second.getBoundingClientRect().top).toBe(first.getBoundingClientRect().bottom);
  },
};

// In a group that is not a list, a separator divides two sets of items and is announced.
export const WithASeparator: Story = {
  render: () => (
    <ItemGroup className="max-w-md">
      <Item>
        <ItemContent>
          <ItemTitle>General clinic</ItemTitle>
          <ItemDescription>Monday at 08:30</ItemDescription>
        </ItemContent>
      </Item>
      <ItemSeparator />
      <Item>
        <ItemContent>
          <ItemTitle>Pre-admission clinic</ItemTitle>
          <ItemDescription>Before your admission</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("separator")).toBeVisible();
  },
};

export const AsALink: Story = {
  render: () => (
    <Item variant="outline" className="max-w-md" render={<a href="#review-clinic" />}>
      <ItemContent>
        <ItemTitle>Review clinic</ItemTitle>
        <ItemDescription>Thursday at 10:15</ItemDescription>
      </ItemContent>
      <ItemActions>
        <ChevronRight aria-hidden className="size-control-icon text-muted-foreground" />
      </ItemActions>
    </Item>
  ),
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: /Review clinic/ });
    link.focus();
    await expect(link).toHaveFocus();
  },
};

const LONG_TITLE = "SYNTHETICTITLE" + "0".repeat(50);
const LONG_DESCRIPTION =
  "A description long enough to need several lines, which shadcn would cut off after two. " +
  "Every line of it stays on the screen here, because the third line can be the one that matters. " +
  "SYNTHETICVALUE" +
  "0".repeat(50);

// An item is where a medicine's name or a result is shown, so nothing in it is cut short. The
// title and the description wrap, even with nowhere to break, and the action stays in the row.
export const WrapsLongContent: Story = {
  render: () => (
    <Item variant="outline" className="w-72" data-testid="narrow">
      <ItemContent>
        <ItemTitle>{LONG_TITLE}</ItemTitle>
        <ItemDescription>{LONG_DESCRIPTION}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="outline" size="sm">
          Open
        </Button>
      </ItemActions>
    </Item>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const item = canvas.getByTestId("narrow");
    await expect(item.scrollWidth).toBeLessThanOrEqual(item.clientWidth);

    for (const text of [LONG_TITLE, LONG_DESCRIPTION]) {
      const element = canvas.getByText(text);
      const style = getComputedStyle(element);
      await expect(style.webkitLineClamp).toBe("none");
      await expect(style.textOverflow).toBe("clip");
      await expect(element.scrollHeight).toBeLessThanOrEqual(element.clientHeight);
    }

    const edge = item.getBoundingClientRect().right;
    await expect(
      canvas.getByRole("button", { name: "Open" }).getBoundingClientRect().right,
    ).toBeLessThanOrEqual(edge);
  },
};

const followsDensity =
  (expected: { padding: number }) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const item = canvas.getByText("Review clinic").closest("[data-slot=item]");
    if (!item) throw new Error("The story has no item.");
    await expect(parseFloat(getComputedStyle(item).paddingLeft)).toBe(expected.padding);
    // Its text is the size of a default control's text, so an item and a field beside it match.
    await expect(getComputedStyle(item).fontSize).toBe(
      getComputedStyle(canvas.getByRole("button", { name: "Reschedule" })).fontSize,
    );
  };

const withDefaultButton: Story["render"] = (args) => (
  <Item {...args} variant="outline" className="max-w-md">
    <ItemContent>
      <ItemTitle>Review clinic</ItemTitle>
    </ItemContent>
    <ItemActions>
      <Button variant="outline">Reschedule</Button>
    </ItemActions>
  </Item>
);

export const FollowsCompactDensity: Story = {
  globals: { density: "compact" },
  render: withDefaultButton,
  play: followsDensity({ padding: 12 }),
};

export const FollowsComfortableDensity: Story = {
  globals: { density: "comfortable" },
  render: withDefaultButton,
  play: followsDensity({ padding: 16 }),
};
