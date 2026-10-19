import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, spyOn, userEvent, waitFor, within } from "storybook/test";

import { MODE_SCRIPT, MODE_STORAGE_KEY, ModeToggle } from "@/components/cadence/mode-toggle";

const changed = fn();

/**
 * The toggle sets `data-mode` on `<html>` and remembers it, as it would in an app. Storybook's own
 * Mode toolbar sets the same attribute, so each story puts both back when it ends.
 */
function restore(previous: string | null) {
  const root = document.documentElement;
  if (previous === null) root.removeAttribute("data-mode");
  else root.setAttribute("data-mode", previous);
  try {
    localStorage.removeItem(MODE_STORAGE_KEY);
  } catch {
    // Nothing was stored.
  }
}

const meta = {
  title: "Composites/ModeToggle",
  component: ModeToggle,
  parameters: { layout: "padded" },
  render: (args) => (
    <div className="flex h-60 justify-end">
      <ModeToggle {...args} />
    </div>
  ),
} satisfies Meta<typeof ModeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

function trigger(canvasElement: HTMLElement) {
  return within(canvasElement).getByRole("button", { name: "Colour mode" });
}

/** The icon the trigger shows: lucide names each icon in its class. */
function icon(canvasElement: HTMLElement) {
  return trigger(canvasElement).querySelector("svg")?.getAttribute("class") ?? "";
}

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const button = trigger(canvasElement);
    await expect(button).toHaveAttribute("data-slot", "mode-toggle");
    await expect(button).toHaveAttribute("aria-haspopup", "menu");
    // Storybook shows the light mode, so the trigger shows a sun.
    await expect(icon(canvasElement)).toContain("lucide-sun");
  },
};

// The open menu is the snapshot that matters: three modes, the chosen one ticked.
export const Open: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(trigger(canvasElement));
    await expect(await screen.findByRole("menu")).toBeVisible();
    await expect(screen.getByRole("group", { name: "Colour mode" })).toBeVisible();
    await expect(screen.getByRole("menuitemradio", { name: "Light" })).toBeChecked();
    await expect(screen.getByRole("menuitemradio", { name: "Dark" })).not.toBeChecked();
    await expect(screen.getByRole("menuitemradio", { name: "System" })).not.toBeChecked();
  },
};

// Dark sets data-mode on <html> and remembers it. System removes both, so the page follows the
// device. The trigger's icon follows the mode the page is shown in.
export const ChoosesAMode: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-mode");
    try {
      await userEvent.click(trigger(canvasElement));
      await userEvent.click(await screen.findByRole("menuitemradio", { name: "Dark" }));
      await expect(root).toHaveAttribute("data-mode", "dark");
      await expect(localStorage.getItem(MODE_STORAGE_KEY)).toBe("dark");
      await waitFor(() => expect(icon(canvasElement)).toContain("lucide-moon"));
      await waitFor(() => expect(trigger(canvasElement)).toHaveFocus());

      await userEvent.click(trigger(canvasElement));
      await expect(await screen.findByRole("menuitemradio", { name: "Dark" })).toBeChecked();
      await userEvent.click(screen.getByRole("menuitemradio", { name: "System" }));
      await expect(root).not.toHaveAttribute("data-mode");
      await expect(localStorage.getItem(MODE_STORAGE_KEY)).toBeNull();
      // Under System the icon is the device's mode.
      const deviceIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      await waitFor(() =>
        expect(icon(canvasElement)).toContain(deviceIsDark ? "lucide-moon" : "lucide-sun"),
      );
    } finally {
      restore(previous);
    }
  },
};

export const ChoosesWithTheKeyboard: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-mode");
    try {
      trigger(canvasElement).focus();
      await userEvent.keyboard("{Enter}");
      // A test types faster than a person: wait until the item has focus before the next key.
      const light = await screen.findByRole("menuitemradio", { name: "Light" });
      await waitFor(() => expect(light).toHaveFocus());
      await userEvent.keyboard("{ArrowDown}");
      await waitFor(() =>
        expect(screen.getByRole("menuitemradio", { name: "Dark" })).toHaveFocus(),
      );
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(root).toHaveAttribute("data-mode", "dark"));
      await waitFor(() => expect(trigger(canvasElement)).toHaveFocus());
    } finally {
      restore(previous);
    }
  },
};

// Where storage is blocked, as in some private windows, the mode still changes for the page.
export const WorksWhenStorageIsBlocked: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-mode");
    const blocked = () => {
      throw new DOMException("Storage is blocked", "SecurityError");
    };
    const setItem = spyOn(Storage.prototype, "setItem").mockImplementation(blocked);
    const removeItem = spyOn(Storage.prototype, "removeItem").mockImplementation(blocked);
    try {
      await userEvent.click(trigger(canvasElement));
      await userEvent.click(await screen.findByRole("menuitemradio", { name: "Dark" }));
      await expect(root).toHaveAttribute("data-mode", "dark");
      await userEvent.click(trigger(canvasElement));
      await userEvent.click(await screen.findByRole("menuitemradio", { name: "System" }));
      await expect(root).not.toHaveAttribute("data-mode");
    } finally {
      setItem.mockRestore();
      removeItem.mockRestore();
      restore(previous);
    }
  },
};

// The script for the page's head applies a remembered mode, ignores anything else, and does
// nothing when storage is blocked.
export const TheHeadScriptAppliesTheRememberedMode: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async () => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-mode");
    // Run as the page's head runs it: an inline script runs as soon as it is in the document.
    const run = () => {
      const script = document.createElement("script");
      script.textContent = MODE_SCRIPT;
      document.head.append(script);
      script.remove();
    };
    try {
      root.removeAttribute("data-mode");
      localStorage.setItem(MODE_STORAGE_KEY, "dark");
      run();
      await expect(root).toHaveAttribute("data-mode", "dark");

      root.removeAttribute("data-mode");
      localStorage.setItem(MODE_STORAGE_KEY, "sepia");
      run();
      await expect(root).not.toHaveAttribute("data-mode");

      const getItem = spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("Storage is blocked", "SecurityError");
      });
      try {
        await expect(run).not.toThrow();
        await expect(root).not.toHaveAttribute("data-mode");
      } finally {
        getItem.mockRestore();
      }
    } finally {
      restore(previous);
    }
  },
};

// Every toggle on the page shows the same mode, and follows a change made anywhere else, such as
// a print view that sets light mode while it is open.
export const FollowsAChangeMadeElsewhere: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-mode");
    try {
      root.setAttribute("data-mode", "dark");
      await waitFor(() => expect(icon(canvasElement)).toContain("lucide-moon"));
      root.setAttribute("data-mode", "light");
      await waitFor(() => expect(icon(canvasElement)).toContain("lucide-sun"));
    } finally {
      restore(previous);
    }
  },
};

// Controlled, the toggle shows the mode it is given, reports a choice, and leaves the page alone.
export const Controlled: Story = {
  args: { value: "dark", onValueChange: changed },
  play: async ({ canvasElement }) => {
    changed.mockClear();
    const root = document.documentElement;
    const before = root.getAttribute("data-mode");
    await expect(icon(canvasElement)).toContain("lucide-moon");
    await userEvent.click(trigger(canvasElement));
    await expect(await screen.findByRole("menuitemradio", { name: "Dark" })).toBeChecked();
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Light" }));
    await expect(changed).toHaveBeenCalledWith("light");
    await expect(root.getAttribute("data-mode")).toBe(before);
  },
};

// The words can be given in another language. These are placeholders, not a translation.
export const OtherWords: Story = {
  args: {
    labels: { trigger: "Display mode", light: "Day", dark: "Night", system: "Device" },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Display mode" }));
    await expect(await screen.findByRole("menuitemradio", { name: "Night" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
  },
};

export const InDarkMode: Story = {
  globals: { mode: "dark" },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(icon(canvasElement)).toContain("lucide-moon"));
    await userEvent.click(trigger(canvasElement));
    await expect(await screen.findByRole("menuitemradio", { name: "Dark" })).toBeChecked();
  },
};

export const OpenComfortable: Story = {
  ...Open,
  globals: { density: "comfortable" },
  play: async ({ canvasElement, ...context }) => {
    await Open.play?.({ canvasElement, ...context });
    await expect(trigger(canvasElement).getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    const item = screen.getByRole("menuitemradio", { name: "System" });
    await expect(item.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  },
};

// On a phone the menu stays on the screen beside a toggle at its edge.
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile1" }, density: "comfortable" },
  parameters: { chromatic: { viewports: [320] } },
  play: async ({ canvasElement }) => {
    await userEvent.click(trigger(canvasElement));
    const menu = await screen.findByRole("menu");
    const box = menu.getBoundingClientRect();
    await expect(box.left).toBeGreaterThanOrEqual(0);
    await expect(box.right).toBeLessThanOrEqual(window.innerWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  },
};
