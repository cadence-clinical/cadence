import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Badge } from "@/components/cadence/badge";
import {
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
} from "@/components/cadence/description-list";

// All content is synthetic.
function Summary({
  orientation,
  className,
}: {
  orientation?: "responsive" | "horizontal" | "vertical";
  className?: string;
}) {
  return (
    <DescriptionList orientation={orientation} className={className}>
      <DescriptionItem>
        <DescriptionTerm>Working problem</DescriptionTerm>
        <DescriptionDetails>Community-acquired pneumonia</DescriptionDetails>
      </DescriptionItem>
      <DescriptionItem>
        <DescriptionTerm>Expected discharge</DescriptionTerm>
        <DescriptionDetails>Wed 21 Oct</DescriptionDetails>
      </DescriptionItem>
      <DescriptionItem>
        <DescriptionTerm>Discharge barriers</DescriptionTerm>
        <DescriptionDetails className="flex flex-wrap gap-1">
          <Badge variant="secondary">Home assessment</Badge>
          <Badge variant="secondary">Family meeting</Badge>
        </DescriptionDetails>
      </DescriptionItem>
    </DescriptionList>
  );
}

const meta = {
  title: "Primitives/Description list",
  component: DescriptionList,
  parameters: { layout: "padded" },
  render: () => <Summary className="max-w-md" />,
} satisfies Meta<typeof DescriptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The term's and the details' boxes, for comparing where they sit. */
function boxes(canvasElement: HTMLElement, term: string) {
  const canvas = within(canvasElement);
  const dt = canvas.getByText(term);
  const details = dt.nextElementSibling;
  if (!(details instanceof HTMLElement)) throw new Error(`No details after ${term}.`);
  return {
    dt: dt.getBoundingClientRect(),
    dd: details.getBoundingClientRect(),
    dtElement: dt,
    ddElement: details,
  };
}

// Side by side where there is room: each term on the same line as its details, and the details
// lined up in one column, as wide as the widest term allows.
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector("dl");
    if (!list) throw new Error("No list rendered.");
    await expect(list).toHaveAttribute("data-slot", "description-list");
    await expect(list).toHaveAttribute("data-orientation", "responsive");
    await expect(list.querySelectorAll("dt")).toHaveLength(3);
    await expect(list.querySelectorAll("dd")).toHaveLength(3);
    const problem = boxes(canvasElement, "Working problem");
    const discharge = boxes(canvasElement, "Expected discharge");
    await expect(Math.abs(problem.dt.top - problem.dd.top)).toBeLessThan(1);
    await expect(problem.dd.left).toBeGreaterThan(problem.dt.right);
    // Every term's details start at the same place.
    await expect(Math.abs(problem.dd.left - discharge.dd.left)).toBeLessThan(1);
    // The term is muted, and the details are in the text's colour.
    await expect(getComputedStyle(problem.dtElement).color).not.toBe(
      getComputedStyle(problem.ddElement).color,
    );
  },
};

// Below 18rem the list stacks each term over its details, measuring its own width, not the
// screen's. Pairs stay apart: the gap between them is wider than the gap inside one.
export const StacksWhenNarrow: Story = {
  render: () => <Summary className="w-60" />,
  play: async ({ canvasElement }) => {
    const problem = boxes(canvasElement, "Working problem");
    const discharge = boxes(canvasElement, "Expected discharge");
    await expect(problem.dd.top).toBeGreaterThanOrEqual(problem.dt.bottom);
    await expect(Math.abs(problem.dd.left - problem.dt.left)).toBeLessThan(1);
    await expect(discharge.dt.top - problem.dd.bottom).toBeGreaterThan(
      problem.dd.top - problem.dt.bottom,
    );
  },
};

// `vertical` stacks every pair at any width, and `horizontal` keeps them side by side.
export const Vertical: Story = {
  render: () => <Summary orientation="vertical" className="max-w-md" />,
  play: async ({ canvasElement }) => {
    const problem = boxes(canvasElement, "Working problem");
    await expect(problem.dd.top).toBeGreaterThanOrEqual(problem.dt.bottom);
  },
};

export const Horizontal: Story = {
  render: () => <Summary orientation="horizontal" className="w-60" />,
  play: async ({ canvasElement }) => {
    const problem = boxes(canvasElement, "Working problem");
    await expect(problem.dd.left).toBeGreaterThan(problem.dt.right);
  },
};

// A long term wraps rather than take the details' room: the terms' column is never more than
// 40% of the list. A long detail wraps too. Neither is cut short.
export const LongTermsAndDetails: Story = {
  render: () => (
    <DescriptionList className="max-w-md">
      <DescriptionItem>
        <DescriptionTerm>Expected date of discharge, as the team last set it</DescriptionTerm>
        <DescriptionDetails>Wed 21 Oct</DescriptionDetails>
      </DescriptionItem>
      <DescriptionItem>
        <DescriptionTerm>Overnight</DescriptionTerm>
        <DescriptionDetails>
          COPD exacerbation, day 3, on oxygen. Oxygen requirement rose this afternoon. Steroids and
          nebulisers continued.
        </DescriptionDetails>
      </DescriptionItem>
    </DescriptionList>
  ),
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector("dl");
    const term = within(canvasElement).getByText(/Expected date of discharge/);
    const details = within(canvasElement).getByText(/COPD exacerbation/);
    if (!list) throw new Error("No list rendered.");
    await expect(term.getBoundingClientRect().width).toBeLessThanOrEqual(
      list.getBoundingClientRect().width * 0.4 + 1,
    );
    for (const element of [term, details]) {
      await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
      await expect(element.getBoundingClientRect().height).toBeGreaterThan(
        parseFloat(getComputedStyle(element).lineHeight) * 1.5,
      );
    }
  },
};

// A term can have several details, each on its own line beside it.
export const SeveralDetails: Story = {
  render: () => (
    <DescriptionList className="max-w-md">
      <DescriptionItem>
        <DescriptionTerm>Open jobs</DescriptionTerm>
        <DescriptionDetails>Chase sputum culture</DescriptionDetails>
        <DescriptionDetails>Repeat chest X-ray tomorrow</DescriptionDetails>
      </DescriptionItem>
    </DescriptionList>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByText("Chase sputum culture").getBoundingClientRect();
    const second = canvas.getByText("Repeat chest X-ray tomorrow").getBoundingClientRect();
    await expect(second.top).toBeGreaterThanOrEqual(first.bottom);
    await expect(Math.abs(second.left - first.left)).toBeLessThan(1);
  },
};

export const FollowsComfortableDensity: Story = {
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector("dl");
    if (!list) throw new Error("No list rendered.");
    await expect(getComputedStyle(list).fontSize).toBe("15px");
  },
};

// On a phone the list fills the width and nothing runs past the screen's edge.
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile1" } },
  parameters: { chromatic: { viewports: [320] } },
  render: () => <Summary />,
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector("dl");
    if (!list) throw new Error("No list rendered.");
    await expect(list.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const InDarkMode: Story = {
  globals: { mode: "dark" },
};
