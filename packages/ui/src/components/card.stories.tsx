import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pencil } from "lucide-react";
import { expect, within } from "storybook/test";

import { Button } from "@/components/cadence/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/cadence/card";

// All content is synthetic.
const meta = {
  title: "Composites/Card",
  component: Card,
  parameters: { layout: "padded" },
  argTypes: { size: { control: "select", options: ["sm", "md"] } },
  render: (args) => (
    <Card {...args} className="max-w-sm">
      <CardHeader>
        <CardTitle render={<h2 />}>Next appointment</CardTitle>
        <CardDescription>Outpatients, Level 2</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Monday at 10:15 with the review clinic. Bring your referral letter.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Confirm attendance</Button>
        <Button size="sm" variant="outline">
          Ask to reschedule
        </Button>
      </CardFooter>
    </Card>
  ),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = { args: { size: "sm" } };

export const WithAction: Story = {
  render: (args) => (
    <Card {...args} className="max-w-sm">
      <CardHeader>
        <CardTitle render={<h2 />}>Contact details</CardTitle>
        <CardDescription>Checked at the last visit</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon" aria-label="Edit contact details">
            <Pencil />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>Main building, east door.</p>
      </CardContent>
    </Card>
  ),
};

export const ContentOnly: Story = {
  render: (args) => (
    <Card {...args} className="max-w-sm">
      <CardContent>
        <p>A card does not need a header or a footer.</p>
      </CardContent>
    </Card>
  ),
};

// A card and the controls inside it change size together. Its text is the size of a Button's
// text, and its padding follows the density set on <html>.
const followsDensity =
  (expected: { padding: number }) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const size = (element: Element) => getComputedStyle(element).fontSize;
    const content = canvas.getByText(/Bring your referral letter/);
    await expect(size(content)).toBe(
      size(canvas.getByRole("button", { name: "Confirm attendance" })),
    );

    const header = canvas.getByRole("heading", { level: 2 }).parentElement;
    if (!header) throw new Error("The title has no header around it.");
    await expect(parseFloat(getComputedStyle(header).paddingLeft)).toBe(expected.padding);
  };

export const FollowsCompactDensity: Story = {
  globals: { density: "compact" },
  play: followsDensity({ padding: 12 }),
};

export const FollowsComfortableDensity: Story = {
  globals: { density: "comfortable" },
  play: followsDensity({ padding: 16 }),
};

// Only the page knows which heading level fits, so the title takes it through `render`. A title
// left as a div cannot be found by someone navigating by headings.
export const TitleIsAHeading: Story = {
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole("heading", { level: 2 });
    await expect(heading).toHaveTextContent("Next appointment");
  },
};

export const RendersAsALabelledRegion: Story = {
  render: (args) => (
    <Card {...args} className="max-w-sm" render={<section aria-labelledby="care-team-title" />}>
      <CardHeader>
        <CardTitle id="care-team-title" render={<h2 />}>
          Care team
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>A nurse, then a doctor.</p>
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("region", { name: "Care team" })).toBeVisible();
  },
};

// Nothing in a card is truncated. A value with nowhere to break still wraps, and the action stays
// in the card.
export const WrapsLongContent: Story = {
  render: (args) => (
    <Card {...args} className="w-64" data-testid="narrow">
      <CardHeader>
        <CardTitle render={<h2 />}>SYNTHETICIDENTIFIER0000000000000000000000000000</CardTitle>
        <CardDescription>SYNTHETICLOCATION000000000000000000000000</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon" aria-label="Edit identifier">
            <Pencil />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>SYNTHETICVALUE00000000000000000000000000000000</CardContent>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const card = within(canvasElement).getByTestId("narrow");
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);

    const edge = card.getBoundingClientRect().right;
    const action = within(canvasElement).getByRole("button", { name: "Edit identifier" });
    await expect(action.getBoundingClientRect().right).toBeLessThanOrEqual(edge);
  },
};

export const FooterActionsWrap: Story = {
  render: (args) => (
    <Card {...args} className="w-56" data-testid="narrow">
      <CardContent>
        <p>Two actions that do not fit on one line.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Confirm attendance</Button>
        <Button size="sm" variant="outline">
          Ask to reschedule
        </Button>
      </CardFooter>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const card = within(canvasElement).getByTestId("narrow");
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
  },
};
