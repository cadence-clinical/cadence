import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/cadence/button";
import { toast, Toaster } from "@/components/cadence/toast";

// All content is synthetic.
const meta = {
  title: "Patterns/Toast",
  component: Toaster,
  parameters: { layout: "padded" },
  render: () => <Demo />,
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

const undo = fn();

const TYPES = [
  { type: "success", title: "Letter saved" },
  { type: "info", title: "Letter sent for review" },
  { type: "warning", title: "Letter saved without a signature" },
  { type: "error", title: "Letter not saved" },
] as const;

/** Buttons that add toasts, inside the Toaster that shows them. */
function Demo() {
  return (
    <Toaster>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            toast.add({
              title: "Letter saved",
              description: "The referrer's copy is in the outbox.",
              type: "success",
            });
          }}
        >
          Save letter
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            toast.add({
              title: "Letter archived",
              actionProps: { children: "Undo", onClick: undo },
            });
          }}
        >
          Archive letter
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            for (const { type, title } of TYPES) toast.add({ type, title });
          }}
        >
          Show each type
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            toast.add({
              title: "Letter not saved",
              description: "The connection was lost. Your changes are still on this screen.",
              type: "error",
              priority: "high",
            });
          }}
        >
          Fail to save
        </Button>
      </div>
    </Toaster>
  );
}

/** The toast with this title, once it has finished coming in. */
async function toastTitled(title: string) {
  // An urgent toast's words are also in a hidden alert, so there can be two.
  const words = await screen.findAllByText(title);
  const item = words.map((element) => element.closest("[data-slot=toast]")).find(Boolean);
  if (!(item instanceof HTMLElement)) throw new Error(`No toast titled "${title}".`);
  await waitFor(() => expect(item).not.toHaveAttribute("data-starting-style"), { timeout: 5000 });
  return item;
}

// Nothing shows until something happens.
export const Default: Story = { parameters: { chromatic: { disableSnapshot: true } } };

// A toast appears in a live region, so a screen reader announces it, with its title and words.
export const AnnouncedWhenItAppears: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Save letter" }));
    const item = await toastTitled("Letter saved");
    await expect(item).toHaveAccessibleDescription(/in the outbox/);
    const region = item.closest("[data-slot=toast-viewport]");
    await expect(region).toHaveAttribute("role", "region");
    await expect(region).toHaveAttribute("aria-live", "polite");
  },
};

// Each type has its own outline, as an Alert's does, so no two differ by colour alone.
export const EachTypeHasItsOwnMark: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Show each type" }));
    const marks = await Promise.all(
      TYPES.map(async ({ title }) => {
        const item = await toastTitled(title);
        const icon = item.querySelector("[data-slot=toast-icon] svg");
        return icon?.getAttribute("class") ?? "";
      }),
    );
    await expect(new Set(marks.map((mark) => /lucide-[a-z-]+/.exec(mark)?.[0])).size).toBe(4);
  },
};

// An urgent toast is announced at once, through an alert, and interrupts what the screen reader
// is saying. So that it is not announced twice, Base UI hides the toast itself from a screen
// reader until focus reaches the toasts, and shows it as soon as it does. axe reads the hidden,
// focusable toast at the moment it is hidden, so that one rule is set aside for it here, as the
// focus guards are in preview.tsx. The play function checks that focus does reveal it.
export const AnUrgentToast: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: "aria-hidden-focus",
            selector: '[data-slot="toast"][role="alertdialog"]',
            enabled: false,
          },
        ],
      },
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Fail to save" }));
    const item = await toastTitled("Letter not saved");
    await expect(item).toHaveAttribute("role", "alertdialog");
    await expect(within(document.body).getByRole("alert")).toHaveTextContent("Letter not saved");
    await expect(item).toHaveAttribute("aria-hidden", "true");
    // Reached with F6, it is read like any other toast.
    await userEvent.keyboard("{F6}");
    await waitFor(() => expect(item).not.toHaveAttribute("aria-hidden"));
  },
};

// A toast can offer an action, such as undoing what happened.
export const WithAnAction: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Archive letter" }));
    const item = await toastTitled("Letter archived");
    await userEvent.click(within(item).getByRole("button", { name: "Undo" }));
    await expect(undo).toHaveBeenCalled();
  },
};

// Base UI hides the close button from a screen reader until the toasts are reached, with F6
// or a pointer, so it is not read out with every toast. Then it closes the toast.
export const CloseDismissesIt: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Save letter" }));
    const item = await toastTitled("Letter saved");
    await expect(within(item).queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    await userEvent.keyboard("{F6}");
    const close = await within(item).findByRole("button", { name: "Close" });
    // It shows only its icon: the word is there for a screen reader.
    const box = close.getBoundingClientRect();
    await expect(box.width).toBe(box.height);
    await userEvent.click(close);
    await waitFor(() => expect(screen.queryByText("Letter saved")).not.toBeInTheDocument(), {
      timeout: 5000,
    });
  },
};

// F6 moves focus to the toasts from anywhere on the page.
export const F6ReachesTheToasts: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const save = within(canvasElement).getByRole("button", { name: "Save letter" });
    await userEvent.click(save);
    const item = await toastTitled("Letter saved");
    await userEvent.keyboard("{F6}");
    await waitFor(() =>
      expect(item.closest("[data-slot=toast-viewport]")?.contains(document.activeElement)).toBe(
        true,
      ),
    );
  },
};

export const FollowsComfortableDensity: Story = {
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Save letter" }));
    const item = await toastTitled("Letter saved");
    const content = item.querySelector("[data-slot=toast-content]");
    if (!content) throw new Error("No content rendered.");
    await expect(getComputedStyle(content).paddingLeft).toBe("16px");
  },
};

// On a phone the toast spans the width at the bottom, with a margin, and its words wrap.
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile1" } },
  parameters: { chromatic: { viewports: [320] } },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Save letter" }));
    const item = await toastTitled("Letter saved");
    const box = item.getBoundingClientRect();
    await expect(box.left).toBeGreaterThanOrEqual(0);
    await expect(box.right).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const InDarkMode: Story = {
  globals: { mode: "dark" },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Save letter" }));
    await toastTitled("Letter saved");
  },
};
