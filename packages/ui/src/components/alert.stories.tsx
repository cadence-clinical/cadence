import type { Meta, StoryObj } from "@storybook/react-vite";
import { WifiOff } from "lucide-react";
import { expect, within } from "storybook/test";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/cadence/alert";
import { Button } from "@/components/cadence/button";

// All content is synthetic.
const meta = {
  title: "Composites/Alert",
  component: Alert,
  parameters: { layout: "padded" },
  argTypes: {
    variant: { control: "select", options: ["default", "critical", "warning", "success", "info"] },
    emphasis: { control: "inline-radio", options: ["outlined", "edge"] },
  },
  render: (args) => (
    <Alert {...args} className="max-w-md">
      <AlertTitle>The clinic list has changed</AlertTitle>
      <AlertDescription>Two appointments were added since you opened it.</AlertDescription>
    </Alert>
  ),
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const STATUSES = [
  ["critical", "Critical", "The observation was not saved", "alert"],
  ["warning", "Warning", "This chart is open in another window", "alert"],
  ["success", "Success", "The appointment is booked", "status"],
  ["info", "Information", "The clinic list updates each morning", "status"],
] as const;

// A quieter alert for a note beside what it is about, as the documentation pages use. The fill
// and the icon stay; the outline becomes a bar down the leading edge, in the same border token.
export const Quieter: Story = {
  render: () => (
    <div className="grid max-w-md gap-3">
      <Alert emphasis="edge">
        <AlertTitle>A note</AlertTitle>
        <AlertDescription>Without a status, the bar is the page&apos;s rule.</AlertDescription>
      </Alert>
      {STATUSES.map(([variant, , title]) => (
        <Alert key={variant} variant={variant} emphasis="edge">
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>What happened, and what to do next.</AlertDescription>
        </Alert>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [note, critical] = canvasElement.querySelectorAll("[data-slot=alert]");
    if (!note || !critical) throw new Error("Nothing rendered.");
    // The padding is even on all four sides, where an outlined alert is tighter top and bottom.
    const bar = getComputedStyle(critical);
    await expect(bar.paddingTop).toBe(bar.paddingLeft);
    await expect(bar.paddingBottom).toBe(bar.paddingRight);
    await expect(bar.paddingTop).toBe("12px");
    // The bar is on the leading edge, and the other three sides have no rule.
    await expect(bar.borderLeftWidth).toBe("4px");
    await expect(bar.borderTopWidth).toBe("0px");
    await expect(bar.borderRightWidth).toBe("0px");
    // It is the status border token, so the status is still marked by more than its fill.
    const outlined = getComputedStyle(note);
    await expect(bar.borderLeftColor).not.toBe(outlined.borderLeftColor);
    // The status keeps its fill and its icon.
    await expect(within(canvasElement).getByRole("img", { name: "Critical" })).toBeVisible();
  },
};

// Each status has its own fill, border, icon outline and word. None rests on colour.
export const Statuses: Story = {
  render: () => (
    <div className="grid max-w-md gap-3">
      {STATUSES.map(([variant, , title]) => (
        <Alert key={variant} variant={variant}>
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>What happened, and what to do next.</AlertDescription>
        </Alert>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fills = new Set<string>();
    for (const [, label, title, role] of STATUSES) {
      const alert = canvas.getByText(title).closest("[data-slot=alert]");
      await expect(alert).toHaveAttribute("role", role);
      if (!(alert instanceof HTMLElement)) throw new Error("No alert");

      // The icon says the status in words, so a screen reader hears what the outline shows.
      await expect(within(alert).getByRole("img", { name: label })).toBeVisible();

      const style = getComputedStyle(alert);
      await expect(style.borderTopColor).not.toBe(style.backgroundColor);
      fills.add(style.backgroundColor);
    }
    await expect(fills.size).toBe(4);
  },
};

// A message that is on the page from the start is not an announcement. It is a region named by
// its title, which a screen reader can move to.
export const AStandingMessage: Story = {
  render: () => (
    <Alert variant="warning" role="region" aria-labelledby="standing-title" className="max-w-md">
      <AlertTitle id="standing-title">This is a training environment</AlertTitle>
      <AlertDescription>Nothing entered here reaches a real record.</AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region", {
      name: "This is a training environment",
    });
    await expect(region).toBeVisible();
    await expect(within(canvasElement).queryByRole("alert")).not.toBeInTheDocument();
  },
};

function WithAnAction({ width }: { width: string }) {
  return (
    <div data-testid={width} className={width}>
      <Alert variant="critical">
        <AlertTitle>The observation was not saved</AlertTitle>
        <AlertDescription>The connection dropped before it was sent.</AlertDescription>
        <AlertAction>
          <Button size="sm" variant="outline">
            Try again
          </Button>
        </AlertAction>
      </Alert>
    </div>
  );
}

// The alert measures itself, not the screen: in a narrow panel the action drops under the words.
export const TheActionMovesWhenThereIsNoRoom: Story = {
  render: () => (
    <div className="grid gap-4">
      <WithAnAction width="w-[32rem]" />
      <WithAnAction width="w-64" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const measure = (testId: string) => {
      const box = within(within(canvasElement).getByTestId(testId));
      return {
        title: box.getByText("The observation was not saved").getBoundingClientRect(),
        description: box.getByText(/connection dropped/).getBoundingClientRect(),
        action: box.getByRole("button", { name: "Try again" }).getBoundingClientRect(),
      };
    };
    const wide = measure("w-[32rem]");
    await expect(wide.action.left).toBeGreaterThanOrEqual(wide.title.right);
    await expect(wide.action.top).toBeLessThan(wide.description.top);

    const narrow = measure("w-64");
    await expect(narrow.action.top).toBeGreaterThanOrEqual(narrow.description.bottom);
    // Under the words, not under the icon.
    await expect(narrow.action.left).toBe(narrow.description.left);
  },
};

// The icon can be replaced, and a status variant still says its status in words.
export const ACustomIcon: Story = {
  render: () => (
    <div className="grid max-w-md gap-3">
      <Alert variant="critical" icon={<WifiOff />}>
        <AlertTitle>You are offline</AlertTitle>
      </Alert>
      <Alert variant="critical" icon={<WifiOff />} iconLabel="Offline">
        <AlertTitle>Changes are kept on this device</AlertTitle>
      </Alert>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("img", { name: "Critical" })).toBeVisible();
    await expect(canvas.getByRole("img", { name: "Offline" })).toBeVisible();
  },
};

const LONG = "SYNTHETIC" + "0".repeat(80);

export const LongWordsWrap: Story = {
  render: () => (
    <div className="w-56">
      <Alert variant="info">
        <AlertTitle>{LONG}</AlertTitle>
        <AlertDescription>{LONG}</AlertDescription>
      </Alert>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector(".w-56");
    await expect(box?.scrollWidth).toBeLessThanOrEqual(box?.clientWidth ?? 0);
    const alert = canvasElement.querySelector("[data-slot=alert]");
    await expect(alert?.scrollWidth).toBeLessThanOrEqual(alert?.clientWidth ?? 0);
  },
};

function padding(canvasElement: HTMLElement) {
  const alert = canvasElement.querySelector("[data-slot=alert]");
  if (!alert) throw new Error("No alert");
  const style = getComputedStyle(alert);
  return [style.paddingLeft, style.paddingTop, style.fontSize];
}

export const Compact: Story = {
  globals: { density: "compact" },
  args: { variant: "info" },
  play: async ({ canvasElement }) => {
    await expect(padding(canvasElement)).toEqual(["12px", "8px", "13px"]);
  },
};

export const Comfortable: Story = {
  globals: { density: "comfortable" },
  args: { variant: "info" },
  play: async ({ canvasElement }) => {
    await expect(padding(canvasElement)).toEqual(["16px", "12px", "15px"]);
  },
};
