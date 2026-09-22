import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarDays, ClipboardList } from "lucide-react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/cadence/tabs";

// All content is synthetic.
const meta = {
  title: "Composites/Tabs",
  component: Tabs,
  parameters: { layout: "padded" },
  args: { defaultValue: "appointments", onValueChange: fn() },
  render: (args) => (
    <Tabs {...args} className="max-w-md">
      <TabsList>
        <TabsTrigger value="appointments">Appointments</TabsTrigger>
        <TabsTrigger value="letters">Letters</TabsTrigger>
        <TabsTrigger value="contacts">Contacts</TabsTrigger>
      </TabsList>
      <TabsContent value="appointments">Two appointments are booked.</TabsContent>
      <TabsContent value="letters">No letters have been sent.</TabsContent>
      <TabsContent value="contacts">One contact is on file.</TabsContent>
    </Tabs>
  ),
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Line: Story = {
  render: (args) => (
    <Tabs {...args} className="max-w-md">
      <TabsList variant="line">
        <TabsTrigger value="appointments">
          <CalendarDays aria-hidden data-icon="inline-start" />
          Appointments
        </TabsTrigger>
        <TabsTrigger value="letters">
          <ClipboardList aria-hidden data-icon="inline-start" />
          Letters
        </TabsTrigger>
      </TabsList>
      <TabsContent value="appointments">Two appointments are booked.</TabsContent>
      <TabsContent value="letters">No letters have been sent.</TabsContent>
    </Tabs>
  ),
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole("tablist");
    await expect(list).toHaveAttribute("aria-orientation", "vertical");
    const [first, second] = within(list).getAllByRole("tab");
    await expect(second?.getBoundingClientRect().top).toBeGreaterThan(
      first?.getBoundingClientRect().top ?? 0,
    );
  },
};

export const ShowsAViewWithThePointer: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tab", { name: "Appointments" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(canvas.getByRole("tabpanel")).toHaveTextContent("Two appointments are booked.");

    await userEvent.click(canvas.getByRole("tab", { name: "Letters" }));
    // Base UI keeps the view it is leaving for a frame, so wait until there is one again.
    await waitFor(() =>
      expect(canvas.getByRole("tabpanel")).toHaveTextContent("No letters have been sent."),
    );
    // The view is named by its tab.
    await expect(canvas.getByRole("tabpanel", { name: "Letters" })).toBeVisible();
    await expect(args.onValueChange).toHaveBeenLastCalledWith("letters", expect.anything());
  },
};

// The arrow keys move between tabs without showing each view on the way. Enter shows one.
export const ShowsAViewWithTheKeyboard: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole("tab", { name: "Appointments" })).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await expect(canvas.getByRole("tab", { name: "Contacts" })).toHaveFocus();
    await expect(canvas.getByRole("tabpanel")).toHaveTextContent("Two appointments are booked.");
    await expect(args.onValueChange).not.toHaveBeenCalled();

    await userEvent.keyboard("{Enter}");
    await waitFor(() =>
      expect(canvas.getByRole("tabpanel")).toHaveTextContent("One contact is on file."),
    );
  },
};

// A view with nothing of its own to focus takes focus itself, and shows that it has it.
export const TheViewShowsItsFocus: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await userEvent.tab();
    const panel = within(canvasElement).getByRole("tabpanel");
    await expect(panel).toHaveFocus();
    await expect(getComputedStyle(panel).boxShadow).not.toBe("none");
  },
};

/** Whether a box sits where a tab is, within a pixel. */
function covers(box: DOMRect, tab: DOMRect) {
  return Math.abs(box.left - tab.left) <= 1 && Math.abs(box.width - tab.width) <= 1;
}

/**
 * The mark of the shown tab, once Base UI has shown it and it has come to rest over `tab`.
 *
 * The mark's position and width are animated. Anything that makes Base UI measure the tabs again
 * after the mark appears, such as a web font arriving or a change of size, sends it sliding for
 * 150ms. Measured once, it can be caught mid-slide, which Chromatic did twice. So this waits.
 */
async function settledOver(canvasElement: HTMLElement, tab: HTMLElement) {
  const mark = canvasElement.querySelector("[data-slot=tabs-indicator]");
  if (!(mark instanceof HTMLElement)) throw new Error("No indicator");
  await waitFor(
    async () => {
      await expect(mark).not.toHaveAttribute("hidden");
      await expect(covers(mark.getBoundingClientRect(), tab.getBoundingClientRect())).toBe(true);
    },
    { timeout: 3000 },
  );
  return mark;
}

// The tab that is shown differs from the rest by more than its colour: its mark has a boundary
// as well as a fill. The mark is the indicator, which takes over from the tab's own once shown.
export const TheShownTabIsMarkedByShape: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const shown = canvas.getByRole("tab", { name: "Appointments" });
    const mark = await settledOver(canvasElement, shown);

    const style = getComputedStyle(mark);
    const list = getComputedStyle(canvas.getByRole("tablist"));
    await expect(style.backgroundColor).not.toBe(list.backgroundColor);
    await expect(style.borderTopColor).not.toBe(style.backgroundColor);
    await expect(style.borderTopWidth).toBe("1px");
    // The tab's own mark has given way, so the two are not drawn twice.
    await expect(getComputedStyle(shown).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  },
};

export const TheShownLineTabCarriesARule: Story = {
  ...Line,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tab = canvas.getByRole("tab", { name: "Appointments" });
    const mark = await settledOver(canvasElement, tab);
    const shown = tab.getBoundingClientRect();
    const rule = mark.getBoundingClientRect();
    await expect(rule.height).toBe(2);
    await expect(Math.abs(rule.bottom - shown.bottom)).toBeLessThanOrEqual(2);
    // The tab's own rule has given way to the indicator.
    await expect(
      getComputedStyle(canvas.getByRole("tab", { name: "Appointments" }), "::after").opacity,
    ).toBe("0");
  },
};

// Chosen with the pointer, the mark slides to the new tab.
export const TheMarkSlidesToTheTabChosenWithThePointer: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const mark = await settledOver(
      canvasElement,
      canvas.getByRole("tab", { name: "Appointments" }),
    );
    await expect(getComputedStyle(mark).transitionProperty.split(", ")).toEqual([
      "translate",
      "width",
      "height",
    ]);
    await expect(getComputedStyle(mark).transitionDuration).toBe("0.15s");

    const contacts = canvas.getByRole("tab", { name: "Contacts" });
    await userEvent.click(contacts);
    await settledOver(canvasElement, contacts);
  },
};

// Chosen from the keyboard, the mark is simply there. The change is what matters, not the trip.
//
// "From the keyboard" is the browser's :focus-visible, which it sets only for real key presses.
// A story's keys are simulated, so after a real click on Storybook's sidebar the browser still
// thinks the pointer is in use and rightly lets the mark slide. The story therefore puts the tab
// into keyboard focus itself, which is what a real arrow key does, and checks what Cadence adds:
// that keyboard focus stops the slide. The arrow keys are tested in ShowsAViewWithTheKeyboard.
export const TheMarkIsSimplyThereFromTheKeyboard: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const mark = await settledOver(
      canvasElement,
      canvas.getByRole("tab", { name: "Appointments" }),
    );
    const letters = canvas.getByRole("tab", { name: "Letters" });
    letters.focus({ focusVisible: true });
    await expect(letters).toHaveFocus();
    await expect(letters.matches(":focus-visible")).toBe(true);
    await expect(getComputedStyle(mark).transitionProperty).toBe("none");

    await userEvent.keyboard("{Enter}");
    await settledOver(canvasElement, letters);
  },
};

export const ADisabledTab: Story = {
  render: (args) => (
    <Tabs {...args} className="max-w-md">
      <TabsList>
        <TabsTrigger value="appointments">Appointments</TabsTrigger>
        <TabsTrigger value="letters" disabled>
          Letters
        </TabsTrigger>
      </TabsList>
      <TabsContent value="appointments">Two appointments are booked.</TabsContent>
      <TabsContent value="letters">No letters have been sent.</TabsContent>
    </Tabs>
  ),
  play: async ({ args, canvasElement }) => {
    const letters = within(canvasElement).getByRole("tab", { name: "Letters" });
    await expect(letters).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(letters, { pointerEventsCheck: 0 });
    await expect(args.onValueChange).not.toHaveBeenCalled();

    // The arrow keys still reach it, so it can be found, and Enter does not show it. Its ring is
    // at full strength: the tab itself is not faded, only its words.
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    await expect(letters).toHaveFocus();
    await expect(getComputedStyle(letters).opacity).toBe("1");
    await expect(getComputedStyle(letters).boxShadow).not.toBe("none");
    await userEvent.keyboard("{Enter}");
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

const MANY = ["Appointments", "Letters", "Contacts", "Referrals", "Documents", "Preferences"];

// Tabs that do not fit go onto another row. None is clipped or scrolled out of view.
export const TabsThatDoNotFitWrap: Story = {
  render: (args) => (
    <div className="w-64">
      <Tabs {...args} defaultValue="Appointments">
        <TabsList>
          {MANY.map((name) => (
            <TabsTrigger key={name} value={name}>
              {name}
            </TabsTrigger>
          ))}
        </TabsList>
        {MANY.map((name) => (
          <TabsContent key={name} value={name}>
            {name}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector(".w-64");
    await expect(box?.scrollWidth).toBeLessThanOrEqual(box?.clientWidth ?? 0);
    const tabs = within(canvasElement).getAllByRole("tab");
    const rows = new Set(tabs.map((tab) => Math.round(tab.getBoundingClientRect().top)));
    await expect(rows.size).toBeGreaterThan(1);
    for (const tab of tabs) await expect(tab).toBeVisible();
  },
};

export const MeetsTouchTargetWhenComfortable: Story = {
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const tab = within(canvasElement).getByRole("tab", { name: "Letters" });
    // The target is a pseudo-element as high as a control, centred on the tab.
    await expect(parseFloat(getComputedStyle(tab, "::before").height)).toBeGreaterThanOrEqual(44);
    await expect(parseFloat(getComputedStyle(tab).fontSize)).toBe(15);
  },
};
