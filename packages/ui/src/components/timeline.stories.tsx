import type { Meta, StoryObj } from "@storybook/react-vite";
import { FlaskConical, MessageSquare, NotebookPen, PencilLine } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Comment, CommentRevoked, CommentText } from "@/components/cadence/comment";
import {
  Timeline,
  TimelineContent,
  TimelineHeader,
  TimelineIcon,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/components/cadence/timeline";
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

// All content is synthetic.
const EVENTS = [
  {
    id: "change",
    kind: "Change",
    filter: "changes",
    icon: PencilLine,
    who: "Dr Tom Ellis",
    at: "2026-10-19T08:03:00+11:00",
    time: "08:03",
    what: "Changed the expected discharge to Wed 21 Oct, from Tue 20 Oct.",
  },
  {
    id: "comment",
    kind: "Comment",
    filter: "comments",
    icon: MessageSquare,
    who: "RN Kate Morgan, Nurse unit manager",
    at: "2026-10-19T05:00:00+11:00",
    time: "05:00",
    what: "Daughter visiting at 1100, keen to talk about going home.",
  },
  {
    id: "result",
    kind: "Results",
    filter: "results",
    icon: FlaskConical,
    who: undefined,
    at: "2026-10-18T21:00:00+11:00",
    time: "Sun 21:00",
    what: "Hb 118 g/L · Cr 74 µmol/L",
  },
  {
    id: "note",
    kind: "Note",
    filter: "notes",
    icon: NotebookPen,
    who: "Dr Mei Chen",
    at: "2026-10-18T09:00:00+11:00",
    time: "Sun 09:00",
    what: "Ward round note: improving on IV antibiotics. Plan to switch to oral tomorrow.",
  },
] as const;

const FILTERS = ["all", "comments", "notes", "results", "changes"] as const;
type Filter = (typeof FILTERS)[number];

function Events({
  variant,
  filter = "all",
}: {
  variant?: "default" | "connected";
  filter?: Filter;
}) {
  return (
    <Timeline variant={variant} aria-label="Activity for Margaret Holloway, newest first">
      {EVENTS.filter((event) => filter === "all" || event.filter === filter).map((event) => {
        const Icon = event.icon;
        return (
          <TimelineItem key={event.id}>
            <TimelineIcon>
              <Icon />
            </TimelineIcon>
            <TimelineHeader>
              <TimelineTitle>{event.kind}</TimelineTitle>
              {event.who === undefined ? null : <span>{event.who}</span>}
              <TimelineTime dateTime={event.at}>{event.time}</TimelineTime>
            </TimelineHeader>
            <TimelineContent>{event.what}</TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}

const meta = {
  title: "Composites/Timeline",
  component: Timeline,
  parameters: { layout: "padded" },
  args: { className: "max-w-sm" },
  render: (args) => (
    <div className={args.className}>
      <Events variant={args.variant ?? undefined} />
    </div>
  ),
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

// A list a screen reader counts, newest first. Each item says its kind, who and when before
// what happened, and the icon is hidden: the kind is in words.
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("list", { name: "Activity for Margaret Holloway, newest first" });
    await expect(list.tagName).toBe("OL");
    const items = within(list).getAllByRole("listitem");
    await expect(items).toHaveLength(EVENTS.length);
    const first = items[0];
    if (!first) throw new Error("No item rendered.");
    const text = first.textContent;
    await expect(text.indexOf("Change")).toBeLessThan(text.indexOf("Dr Tom Ellis"));
    await expect(text.indexOf("Dr Tom Ellis")).toBeLessThan(text.indexOf("08:03"));
    await expect(text.indexOf("08:03")).toBeLessThan(text.indexOf("Changed the expected"));
    const time = within(first).getByText("08:03");
    await expect(time.tagName).toBe("TIME");
    await expect(time).toHaveAttribute("datetime", "2026-10-19T08:03:00+11:00");
    for (const icon of canvasElement.querySelectorAll("[data-slot=timeline-icon]")) {
      await expect(icon).toHaveAttribute("aria-hidden", "true");
    }
    // The header's first line is centred on the icon.
    const icon = first.querySelector("[data-slot=timeline-icon]");
    const title = within(first).getByText("Change");
    if (!icon) throw new Error("No icon rendered.");
    const iconBox = icon.getBoundingClientRect();
    const titleBox = title.getBoundingClientRect();
    await expect(
      Math.abs(iconBox.top + iconBox.height / 2 - (titleBox.top + titleBox.height / 2)),
    ).toBeLessThan(2);
    // Without the connecting rule, no item draws one.
    await expect(getComputedStyle(first, "::before").display).toBe("none");
  },
};

// `connected` joins each icon to the next with a rule, and the last item has none.
export const Connected: Story = {
  args: { variant: "connected" },
  play: async ({ canvasElement }) => {
    const items = within(canvasElement).getAllByRole("listitem");
    const first = items[0];
    const second = items[1];
    const last = items.at(-1);
    if (!first || !second || !last) throw new Error("No items rendered.");
    const rule = getComputedStyle(first, "::before");
    await expect(rule.display).toBe("block");
    await expect(rule.width).toBe("1px");
    // The rule runs from under the first icon to above the next one.
    const firstIcon = first.querySelector("[data-slot=timeline-icon]");
    const nextIcon = second.querySelector("[data-slot=timeline-icon]");
    if (!firstIcon || !nextIcon) throw new Error("No icons rendered.");
    const top = first.getBoundingClientRect().top + parseFloat(rule.top);
    const bottom = top + parseFloat(rule.height);
    await expect(top).toBeGreaterThan(firstIcon.getBoundingClientRect().bottom);
    await expect(bottom).toBeLessThan(nextIcon.getBoundingClientRect().top);
    await expect(nextIcon.getBoundingClientRect().top - bottom).toBeLessThan(8);
    await expect(getComputedStyle(last, "::before").display).toBe("none");
  },
};

// Any content can be what happened, such as a Comment. The header carries the kind, who and
// when, so the comment shows only its text and its marks.
export const WithAComment: Story = {
  render: () => (
    <Timeline className="max-w-sm" aria-label="Activity, newest first">
      <TimelineItem>
        <TimelineIcon>
          <MessageSquare />
        </TimelineIcon>
        <TimelineHeader>
          <TimelineTitle>Comment</TimelineTitle>
          <span>Dr Tom Ellis, Registrar</span>
          <TimelineTime dateTime="2026-10-19T08:02:00+11:00">08:02</TimelineTime>
        </TimelineHeader>
        <TimelineContent>
          <Comment status="revoked">
            <CommentText>Family meeting booked for 1400.</CommentText>
            <CommentRevoked by="Dr Tom Ellis" time="08:14" dateTime="2026-10-19T08:14:00+11:00" />
          </Comment>
        </TimelineContent>
      </TimelineItem>
    </Timeline>
  ),
  play: async ({ canvasElement }) => {
    const item = within(canvasElement).getByRole("listitem");
    const text = item.textContent;
    await expect(text.indexOf("Comment")).toBeLessThan(text.indexOf("Revoked:"));
    await expect(text.indexOf("08:02")).toBeLessThan(text.indexOf("Family meeting"));
    await expect(within(item).getByText("Family meeting booked for 1400.")).toHaveStyle({
      textDecorationLine: "line-through",
    });
  },
};

/** The timeline with a filter: a toggle group of kinds, where releasing a kind shows them all. */
function Filtered() {
  const [filter, setFilter] = useState<Filter>("all");
  return (
    <div className="flex max-w-sm flex-col gap-container">
      <ToggleGroup
        aria-label="Show in the timeline"
        size="sm"
        variant="outline"
        spacing={0}
        value={[filter]}
        onValueChange={(value: string[]) => {
          // Nothing pressed means the pressed kind was released: show everything.
          const chosen = FILTERS.find((item) => item === value[0]);
          setFilter(chosen ?? "all");
        }}
      >
        <ToggleGroupItem value="all">All</ToggleGroupItem>
        <ToggleGroupItem value="comments">Comments</ToggleGroupItem>
        <ToggleGroupItem value="notes">Notes</ToggleGroupItem>
        <ToggleGroupItem value="results">Results</ToggleGroupItem>
        <ToggleGroupItem value="changes">Changes</ToggleGroupItem>
      </ToggleGroup>
      <Events filter={filter} />
    </div>
  );
}

// A toggle group filters the timeline by kind. Pressing a kind shows only that kind, and pressing
// it again, or All, shows everything, so one filter is always pressed.
export const FilteredByKind: Story = {
  render: () => <Filtered />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const all = canvas.getByRole("button", { name: "All" });
    const comments = canvas.getByRole("button", { name: "Comments" });
    await expect(all).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getAllByRole("listitem")).toHaveLength(EVENTS.length);
    await userEvent.click(comments);
    await expect(comments).toHaveAttribute("aria-pressed", "true");
    await expect(all).toHaveAttribute("aria-pressed", "false");
    await expect(canvas.getAllByRole("listitem")).toHaveLength(1);
    await expect(canvas.getByRole("listitem")).toHaveTextContent(/^Comment/);
    // Released, the filter goes back to All.
    await userEvent.click(comments);
    await expect(all).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getAllByRole("listitem")).toHaveLength(EVENTS.length);
    // From the keyboard: the group is one stop, and the arrows move between the kinds.
    await userEvent.click(all);
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await expect(canvas.getByRole("button", { name: "Notes" })).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(canvas.getAllByRole("listitem")).toHaveLength(1);
  },
};

// In a narrow space the header wraps between its parts, and each dot moves with the part after
// it, so no line ends on a dot.
export const ALongHeaderWraps: Story = {
  render: () => (
    <div className="w-56">
      <Events />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector("[data-slot=timeline-header]");
    if (!header) throw new Error("No header rendered.");
    const lineHeight = parseFloat(getComputedStyle(header).lineHeight);
    // The comment's header runs to more than one line.
    const comment = within(canvasElement).getByText("RN Kate Morgan, Nurse unit manager");
    const commentHeader = comment.closest("[data-slot=timeline-header]");
    if (!(commentHeader instanceof HTMLElement)) throw new Error("No comment header.");
    await expect(commentHeader.getBoundingClientRect().height).toBeGreaterThan(lineHeight * 1.5);
    for (const dot of commentHeader.querySelectorAll("[aria-hidden]")) {
      const next = dot.nextElementSibling;
      if (!next) throw new Error("A dot with nothing after it.");
      await expect(
        Math.abs(dot.getBoundingClientRect().top - next.getBoundingClientRect().top),
      ).toBeLessThan(lineHeight / 2);
    }
  },
};

// Without icons, the header and content take the whole width.
export const WithoutIcons: Story = {
  render: () => (
    <Timeline className="max-w-sm" aria-label="Changes, newest first">
      <TimelineItem>
        <TimelineHeader>
          <TimelineTitle>Change</TimelineTitle>
          <span>Dr Tom Ellis</span>
          <TimelineTime dateTime="2026-10-19T08:03:00+11:00">08:03</TimelineTime>
        </TimelineHeader>
        <TimelineContent>Marked seen today.</TimelineContent>
      </TimelineItem>
    </Timeline>
  ),
  play: async ({ canvasElement }) => {
    const item = within(canvasElement).getByRole("listitem");
    const content = within(item).getByText("Marked seen today.");
    await expect(
      Math.abs(content.getBoundingClientRect().left - item.getBoundingClientRect().left),
    ).toBeLessThan(1);
  },
};

// Compact, the default: 13px text and a 24px circle round each icon.
export const Compact: Story = {
  globals: { density: "compact" },
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector("ol");
    const icon = canvasElement.querySelector("[data-slot=timeline-icon]");
    if (!list || !icon) throw new Error("No timeline rendered.");
    await expect(getComputedStyle(list).fontSize).toBe("13px");
    await expect(icon.getBoundingClientRect().width).toBe(24);
  },
};

export const FollowsComfortableDensity: Story = {
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector("ol");
    const icon = canvasElement.querySelector("[data-slot=timeline-icon]");
    if (!list || !icon) throw new Error("No timeline rendered.");
    await expect(getComputedStyle(list).fontSize).toBe("15px");
    await expect(icon.getBoundingClientRect().width).toBe(30);
  },
};

// On a phone, a long header wraps between its parts, and nothing runs past the screen's edge.
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile1" } },
  parameters: { chromatic: { viewports: [320] } },
  args: { className: undefined, variant: "connected" },
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector("ol");
    if (!list) throw new Error("No timeline rendered.");
    await expect(list.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    for (const content of canvasElement.querySelectorAll("[data-slot=timeline-content]")) {
      await expect(content.scrollWidth).toBeLessThanOrEqual(content.clientWidth);
    }
  },
};

export const InDarkMode: Story = {
  globals: { mode: "dark" },
  args: { variant: "connected" },
};
