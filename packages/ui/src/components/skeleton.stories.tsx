import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Skeleton } from "@/components/cadence/skeleton";
import { Spinner } from "@/components/cadence/spinner";

/** A row of a list while it loads: a round picture and two lines of text. */
function LoadingRow() {
  return (
    <div className="flex w-full max-w-sm items-center gap-3">
      <Skeleton className="size-control-lg shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

const meta = {
  title: "Primitives/Skeleton",
  component: Skeleton,
  parameters: { layout: "padded", chromatic: { pauseAnimationAtEnd: true } },
  render: () => <LoadingRow />,
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const skeletons = canvasElement.querySelectorAll("[data-slot=skeleton]");
    await expect(skeletons).toHaveLength(3);
    // It is only a shape. Nothing in it is read out.
    for (const skeleton of skeletons) await expect(skeleton).toHaveAttribute("aria-hidden", "true");
  },
};

// The region says it is busy, and a status says what is loading, in words.
export const WhileARegionLoads: Story = {
  render: () => (
    <section aria-label="Appointments" aria-busy="true" className="flex flex-col gap-3">
      <Spinner aria-label="Loading appointments" />
      <LoadingRow />
      <LoadingRow />
    </section>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: "Appointments" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(canvas.getByRole("status", { name: "Loading appointments" })).toBeVisible();
  },
};

/** Relative luminance of an sRGB colour, as WCAG defines it. */
function luminance([r, g, b]: readonly number[]): number {
  const linear = (value = 0) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/**
 * The contrast between a skeleton and the surface under it. The browser paints both computed
 * colours onto a canvas, so the skeleton's transparency is mixed as it is on screen.
 */
function contrastOnSurface(skeleton: Element, surface: Element): number {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser gave no canvas to paint on.");
  const paint = (...fills: string[]) => {
    context.clearRect(0, 0, 1, 1);
    for (const fill of fills) {
      context.fillStyle = fill;
      context.fillRect(0, 0, 1, 1);
    }
    return [...context.getImageData(0, 0, 1, 1).data];
  };
  const behind = getComputedStyle(surface).backgroundColor;
  const front = getComputedStyle(skeleton).backgroundColor;
  const [light = 0, dark = 0] = [luminance(paint(behind)), luminance(paint(behind, front))].sort(
    (a, b) => b - a,
  );
  return (light + 0.05) / (dark + 0.05);
}

/** The same row on a card and on a muted surface, as in a table's header or a card's footer. */
function OnEachSurface() {
  return (
    <div className="flex flex-col gap-3">
      <div data-surface="card" className="rounded-lg border bg-card p-container">
        <LoadingRow />
      </div>
      <div data-surface="muted" className="rounded-lg bg-muted p-container">
        <LoadingRow />
      </div>
    </div>
  );
}

/** At least as clear as shadcn's skeleton on a white page, which is 1.10:1. */
async function expectVisibleOnEachSurface(canvasElement: HTMLElement) {
  for (const surface of canvasElement.querySelectorAll("[data-surface]")) {
    const skeleton = surface.querySelector("[data-slot=skeleton]");
    if (!skeleton) throw new Error("The surface has no skeleton.");
    await expect(contrastOnSurface(skeleton, surface)).toBeGreaterThanOrEqual(1.15);
  }
}

// Lagoon's muted surface is where the skeleton has least contrast of any brand or mode.
export const ShowsOnEverySurface: Story = {
  globals: { brand: "lagoon" },
  render: () => <OnEachSurface />,
  play: async ({ canvasElement }) => {
    await expectVisibleOnEachSurface(canvasElement);
  },
};

// Midnight's page is its muted colour, where a skeleton filled with muted would not show at all.
export const OnAPageThatIsMuted: Story = {
  globals: { brand: "midnight" },
  render: () => <OnEachSurface />,
  play: async ({ canvasElement }) => {
    await expectVisibleOnEachSurface(canvasElement);
  },
};

export const InDarkMode: Story = {
  globals: { mode: "dark" },
  render: () => <OnEachSurface />,
  play: async ({ canvasElement }) => {
    await expectVisibleOnEachSurface(canvasElement);
  },
};

// Standing in for a control, it takes the control's height, so the layout does not move when the
// control arrives, at either density.
export const TheSizeOfAControl: Story = {
  globals: { density: "comfortable" },
  render: () => <Skeleton className="h-control w-40" />,
  play: async ({ canvasElement }) => {
    const skeleton = canvasElement.querySelector("[data-slot=skeleton]");
    if (!skeleton) throw new Error("No skeleton rendered.");
    await expect(getComputedStyle(skeleton).height).toBe("44px");
  },
};
