import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pencil, Trash2 } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Button } from "@/components/cadence/button";
import {
  Comment,
  CommentActions,
  CommentAuthor,
  CommentEdited,
  CommentHeader,
  CommentList,
  CommentProvenance,
  CommentRevoked,
  CommentRole,
  CommentText,
  CommentTime,
} from "@/components/cadence/comment";

// All content is synthetic.
const HANDOVER =
  "Cardiac issues now lead: transferring to Team A for ongoing management. Rate control started overnight, and the family know about the move.";

function Full() {
  return (
    <Comment className="max-w-md">
      <CommentHeader>
        <CommentAuthor>Dr Grace Kim</CommentAuthor>
        <CommentRole>Registrar, GMU C</CommentRole>
        <CommentTime dateTime="2026-10-19T06:00:00+11:00">Mon 19 Oct, 06:00</CommentTime>
      </CommentHeader>
      <CommentText>{HANDOVER}</CommentText>
    </Comment>
  );
}

const meta = {
  title: "Composites/Comment",
  component: Comment,
  parameters: { layout: "padded" },
  render: () => <Full />,
} satisfies Meta<typeof Comment>;

export default meta;
type Story = StoryObj<typeof meta>;

// The whole comment, for a thread: author, role and time on one line, then the text, which wraps.
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Dr Grace Kim")).toBeVisible();
    await expect(canvas.getByText("Registrar, GMU C")).toBeVisible();
    const time = canvas.getByText("Mon 19 Oct, 06:00");
    await expect(time.tagName).toBe("TIME");
    await expect(time).toHaveAttribute("datetime", "2026-10-19T06:00:00+11:00");
    // The text is whole, on as many lines as it needs.
    const text = canvas.getByText(HANDOVER);
    await expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth);
    await expect(text.getBoundingClientRect().height).toBeGreaterThan(30);
  },
};

function CompactInACell() {
  return (
    <div className="w-64 rounded-md border p-container-sm">
      <Comment size="compact">
        <CommentText>{HANDOVER}</CommentText>
        <CommentHeader>
          <CommentAuthor>Dr Grace Kim</CommentAuthor>
          <CommentRole>Registrar, GMU C</CommentRole>
          <CommentTime dateTime="2026-10-19T06:00:00+11:00">06:00</CommentTime>
        </CommentHeader>
      </Comment>
    </div>
  );
}

// Two lines for a table cell: the text cut to one line, then the author and the time. The role is
// left out, and the whole comment belongs one step away, such as in the record the row opens.
export const Compact: Story = {
  render: () => <CompactInACell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = canvas.getByText(HANDOVER);
    await expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
    const lineHeight = parseFloat(getComputedStyle(text).lineHeight);
    await expect(text.getBoundingClientRect().height).toBeLessThanOrEqual(lineHeight + 1);
    await expect(canvas.getByText("Registrar, GMU C")).not.toBeVisible();
    const header = canvas.getByText("Dr Grace Kim").parentElement;
    await expect(header?.getBoundingClientRect().height).toBeLessThanOrEqual(lineHeight + 1);
    // The whole comment is still in the text, for a screen reader.
    await expect(text).toHaveTextContent(HANDOVER);
  },
};

export const CompactComfortable: Story = {
  render: () => <CompactInACell />,
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const text = within(canvasElement).getByText(HANDOVER);
    await expect(parseFloat(getComputedStyle(text).fontSize)).toBeGreaterThanOrEqual(15);
  },
};

// The dots between the parts are for the eye. A screen reader hears the parts, not "dot".
export const TheDotsAreNotRead: Story = {
  play: async ({ canvasElement }) => {
    const dots = Array.from(
      canvasElement.querySelectorAll("[data-slot=comment-header] > span"),
    ).filter((span) => span.textContent === "·");
    await expect(dots).toHaveLength(2);
    for (const dot of dots) await expect(dot).toHaveAttribute("aria-hidden", "true");
  },
};

const THREAD = [
  {
    id: "c3",
    author: "Dr Tom Ellis",
    role: "Registrar, GMU A",
    at: "2026-10-19T07:40:00+11:00",
    time: "07:40",
    text: "Seen on arrival. Happy to accept once the echo is booked.",
  },
  {
    id: "c2",
    author: "RN Daniel Reyes",
    role: "Clinical nurse",
    at: "2026-10-19T06:30:00+11:00",
    time: "06:30",
    text: "Bed 411 B ready.",
  },
  {
    id: "c1",
    author: "Dr Grace Kim",
    role: "Registrar, GMU C",
    at: "2026-10-19T06:00:00+11:00",
    time: "06:00",
    text: HANDOVER,
  },
];

function Thread() {
  return (
    <CommentList aria-label="Comments, newest first" className="max-w-md">
      {THREAD.map((comment) => (
        <Comment key={comment.id} render={<li />}>
          <CommentHeader>
            <CommentAuthor>{comment.author}</CommentAuthor>
            <CommentRole>{comment.role}</CommentRole>
            <CommentTime dateTime={comment.at}>{comment.time}</CommentTime>
          </CommentHeader>
          <CommentText>{comment.text}</CommentText>
        </Comment>
      ))}
    </CommentList>
  );
}

// A thread is a list, so a screen reader says how many comments there are. A rule parts them.
export const AThread: Story = {
  render: () => <Thread />,
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole("list", { name: "Comments, newest first" });
    const items = within(list).getAllByRole("listitem");
    await expect(items).toHaveLength(3);
    await expect(items[0]).toHaveTextContent("Dr Tom Ellis");
    await expect(getComputedStyle(items[1] ?? list).borderTopWidth).toBe("1px");
  },
};

export const AThreadComfortable: Story = {
  render: () => <Thread />,
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole("listitem")).toHaveLength(3);
  },
};

// An AI drafted this comment. The mark says what drafted it, who reviewed it, and where it came
// from, with an icon and words, and it stays after review.
export const DraftedByAI: Story = {
  render: () => (
    <Comment className="max-w-md">
      <CommentHeader>
        <CommentAuthor>Dr Ravi Patel</CommentAuthor>
        <CommentRole>Registrar, GMU B</CommentRole>
        <CommentTime dateTime="2026-10-18T17:00:00+11:00">Sun 18 Oct, 17:00</CommentTime>
      </CommentHeader>
      <CommentText>Oxygen requirement rose this afternoon. Review at 2200.</CommentText>
      <CommentProvenance
        drafter="Handover assistant (synthetic)"
        reviewedBy="Dr Ravi Patel"
        sources={[
          { label: "Progress note 18 Oct 1600", href: "#note" },
          { label: "Observations 18 Oct 1400 to 1800" },
        ]}
      />
    </Comment>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Drafted by AI:")).toBeVisible();
    await expect(
      canvas.getByText("Handover assistant (synthetic), reviewed by Dr Ravi Patel"),
    ).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Progress note 18 Oct 1600" })).toHaveAttribute(
      "href",
      "#note",
    );
  },
};

// A drafted comment with no source says so, and one nobody has reviewed says that too.
export const DraftedWithNoSource: Story = {
  render: () => (
    <Comment size="default" className="max-w-md">
      <CommentText>Family meeting suggested for Thursday.</CommentText>
      <CommentProvenance drafter="Handover assistant (synthetic)" sources={[]} />
    </Comment>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("No source")).toBeVisible();
    await expect(canvas.getByText(/not reviewed yet/)).toBeVisible();
  },
};

// In a compact comment the mark is the icon and "AI draft", beside the author and the time.
export const DraftedCompact: Story = {
  render: () => (
    <div className="w-64">
      <Comment size="compact">
        <CommentText>Oxygen requirement rose this afternoon. Review at 2200.</CommentText>
        <CommentHeader>
          <CommentAuthor>Dr Ravi Patel</CommentAuthor>
          <CommentTime dateTime="2026-10-18T17:00:00+11:00">17:00</CommentTime>
          <CommentProvenance drafter="Handover assistant (synthetic)" sources={[]} />
        </CommentHeader>
      </Comment>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("AI draft")).toBeVisible();
  },
};

// On a phone a thread takes the width, and its text wraps.
export const OnAPhone: Story = {
  render: () => <Thread />,
  globals: { viewport: { value: "mobile1" } },
  parameters: { chromatic: { viewports: [320] } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole("listitem")).toHaveLength(3);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  },
};

const edit = fn();
const remove = fn();
const revoke = fn();

const POSTED = "Echo booked for 1400. Happy to accept after it.";

/** A comment its author has just posted, with Edit, Delete and how long they have left. */
function JustPostedComment({ asItem = false }: { asItem?: boolean }) {
  return (
    <Comment className="max-w-md" render={asItem ? <li /> : undefined}>
      <CommentHeader>
        <CommentAuthor>Dr Tom Ellis</CommentAuthor>
        <CommentRole>Registrar, GMU A</CommentRole>
        <CommentTime dateTime="2026-10-19T08:14:00+11:00">08:14</CommentTime>
      </CommentHeader>
      <CommentText>{POSTED}</CommentText>
      <CommentActions>
        <Button variant="ghost" size="sm" onClick={edit}>
          <Pencil aria-hidden data-icon="inline-start" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={remove}>
          <Trash2 aria-hidden data-icon="inline-start" />
          Delete
        </Button>
        <span>Editable for 8 s</span>
      </CommentActions>
    </Comment>
  );
}

// Just posted: its author can still edit or delete it, and the actions say for how long.
export const WithActions: Story = {
  render: () => <JustPostedComment />,
  play: async ({ canvasElement }) => {
    edit.mockClear();
    remove.mockClear();
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Edit" }));
    await expect(edit).toHaveBeenCalledOnce();
    await userEvent.click(canvas.getByRole("button", { name: "Delete" }));
    await expect(remove).toHaveBeenCalledOnce();
    await expect(canvas.getByText("Editable for 8 s")).toBeVisible();
  },
};

export const WithActionsComfortable: Story = {
  render: () => <JustPostedComment />,
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "Edit" });
    await expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(36);
  },
};

// Changed after it was posted: the header says so.
export const Edited: Story = {
  render: () => (
    <Comment className="max-w-md">
      <CommentHeader>
        <CommentAuthor>Dr Tom Ellis</CommentAuthor>
        <CommentRole>Registrar, GMU A</CommentRole>
        <CommentTime dateTime="2026-10-19T08:14:00+11:00">08:14</CommentTime>
        <CommentEdited />
      </CommentHeader>
      <CommentText>{POSTED}</CommentText>
    </Comment>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Edited")).toBeVisible();
  },
};

/** A comment revoked after the time to edit it had passed: it stays, struck through, with who and when. */
function RevokedComment({
  drafted = false,
  asItem = false,
}: {
  drafted?: boolean;
  asItem?: boolean;
}) {
  return (
    <Comment status="revoked" className="max-w-md" render={asItem ? <li /> : undefined}>
      <CommentHeader>
        <CommentAuthor>Dr Tom Ellis</CommentAuthor>
        <CommentRole>Registrar, GMU A</CommentRole>
        <CommentTime dateTime="2026-10-19T07:40:00+11:00">07:40</CommentTime>
      </CommentHeader>
      <CommentText>{POSTED}</CommentText>
      <CommentRevoked by="Dr Tom Ellis" time="08:14" dateTime="2026-10-19T08:14:00+11:00" />
      {drafted ? (
        <CommentProvenance
          drafter="Handover assistant (synthetic)"
          reviewedBy="Dr Tom Ellis"
          sources={[{ label: "Echo request 19 Oct", href: "#echo" }]}
        />
      ) : null}
    </Comment>
  );
}

// Revoked: never removed. The text is struck through and muted, a screen reader hears "Revoked:"
// before it, and the comment says who revoked it and when, in words with an icon.
export const Revoked: Story = {
  render: () => <RevokedComment />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = canvas.getByText(POSTED).closest("p");
    if (!text) throw new Error("No text");
    await expect(getComputedStyle(text).textDecorationLine).toContain("line-through");
    await expect(text).toHaveTextContent(`Revoked: ${POSTED}`);
    const revoked = canvas.getByText("Revoked by", { exact: false });
    await expect(revoked).toBeVisible();
    await expect(revoked).toHaveTextContent("Revoked by Dr Tom Ellis, 08:14");
    await expect(canvas.getByText("08:14")).toHaveAttribute(
      "datetime",
      "2026-10-19T08:14:00+11:00",
    );
  },
};

export const RevokedComfortable: Story = {
  render: () => <RevokedComment />,
  globals: { density: "comfortable" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Revoked by", { exact: false })).toBeVisible();
  },
};

// Revoking a comment an AI drafted keeps its mark and its sources.
export const RevokedDraftedByAI: Story = {
  render: () => <RevokedComment drafted />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Drafted by AI:")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Echo request 19 Oct" })).toBeVisible();
    await expect(canvas.getByText("Revoked by", { exact: false })).toBeVisible();
  },
};

// In a table cell, a revoked comment is the struck-through text, then "Revoked" with its icon
// beside the author and the time. Actions are left to the thread.
export const RevokedCompact: Story = {
  render: () => (
    <div className="w-64 rounded-md border p-container-sm">
      <Comment size="compact" status="revoked">
        <CommentText>{POSTED}</CommentText>
        <CommentHeader>
          <CommentRevoked by="Dr Tom Ellis" time="08:14" dateTime="2026-10-19T08:14:00+11:00" />
          <CommentAuthor>Dr Tom Ellis</CommentAuthor>
          <CommentTime dateTime="2026-10-19T07:40:00+11:00">07:40</CommentTime>
        </CommentHeader>
        <CommentActions>
          <Button variant="ghost" size="sm" onClick={revoke}>
            Revoke
          </Button>
        </CommentActions>
      </Comment>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Revoked", { exact: true })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Revoke", hidden: true })).not.toBeVisible();
    const text = canvas.getByText(POSTED).closest("p");
    if (!text) throw new Error("No text");
    await expect(getComputedStyle(text).textDecorationLine).toContain("line-through");
  },
};

// Two lines of text for a table row of three lines, then the header on the third.
export const CompactTwoLines: Story = {
  render: () => (
    <div className="w-64 rounded-md border p-container-sm">
      <Comment size="compact" lines={2}>
        <CommentText>{HANDOVER}</CommentText>
        <CommentHeader>
          <CommentAuthor>Dr Grace Kim</CommentAuthor>
          <CommentTime dateTime="2026-10-19T06:00:00+11:00">06:00</CommentTime>
        </CommentHeader>
      </Comment>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const text = within(canvasElement).getByText(HANDOVER);
    const lineHeight = parseFloat(getComputedStyle(text).lineHeight);
    await expect(Math.round(text.clientHeight / lineHeight)).toBe(2);
    await expect(text.scrollHeight).toBeGreaterThan(text.clientHeight);
  },
};

// On a phone a revoked comment and its actions wrap to the width.
export const RevokedOnAPhone: Story = {
  render: () => (
    <CommentList aria-label="Comments, newest first">
      <JustPostedComment asItem />
      <RevokedComment asItem />
    </CommentList>
  ),
  globals: { viewport: { value: "mobile1" } },
  parameters: { chromatic: { viewports: [320] } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole("listitem")).toHaveLength(2);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  },
};
