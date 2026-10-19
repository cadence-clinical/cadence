"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { Ban, Sparkles } from "lucide-react";
import { Children, createContext, use, type ComponentProps, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/** How much room a comment has: `default` for a thread, `compact` for a table cell. */
type CommentSize = "default" | "compact";

/**
 * Whether a comment still stands: `active`, or `revoked` by someone after it was posted. A revoked
 * comment stays in the thread with its text struck through and the word "Revoked".
 */
type CommentStatus = "active" | "revoked";

/** How many lines a compact comment's text may take: one, or two in a taller table row. */
type CommentLines = 1 | 2;

interface CommentContextValue {
  size: CommentSize;
  status: CommentStatus;
  lines: CommentLines;
}

const CommentContext = createContext<CommentContextValue>({
  size: "default",
  status: "active",
  lines: 1,
});

/** A `div` by default, with Base UI's `render` to make it another element, plus `size`. */
type CommentProps = useRender.ComponentProps<"div"> & {
  /**
   * `default` shows the whole comment, for a thread. `compact` fits two lines of a table cell: put
   * `CommentText` first, which is cut to one line, then a `CommentHeader` of author and time.
   */
  size?: CommentSize;
  /**
   * `revoked` strikes the text through, starts it with "Revoked:" for a screen reader, and mutes
   * it. Add a `CommentRevoked` to say who revoked it and when. Defaults to `active`.
   */
  status?: CommentStatus;
  /**
   * In a compact comment, how many lines the text may take before it is cut: `2` for a table row
   * of three lines, with the header on the third. Defaults to `1`.
   */
  lines?: CommentLines;
};

/**
 * One comment: who wrote it, their role, when, and what they said. In a thread, render each one as
 * an `li` inside a `CommentList`. In a table cell, use `size="compact"`, and show the whole comment
 * one step away, such as in the record the row opens, because the compact text is cut short.
 *
 * A comment can say it was edited, with `CommentEdited`, and be revoked, with `status="revoked"`
 * and a `CommentRevoked` that says who revoked it and when. A revoked comment is never removed.
 * `CommentActions` holds the author's actions, such as Edit, Delete or Revoke.
 */
function Comment({
  className,
  size = "default",
  status = "active",
  lines = 1,
  render,
  ...props
}: CommentProps) {
  const element = useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        className: cn(
          "group/comment flex min-w-0 flex-col text-body",
          "data-[size=compact]:gap-0.5 data-[size=default]:gap-1",
          className,
        ),
      },
      props,
    ),
    state: { slot: "comment", size, status },
  });
  return <CommentContext value={{ size, status, lines }}>{element}</CommentContext>;
}

/** A thread of comments: an `ol`, so a screen reader says how many there are. */
function CommentList({ className, ...props }: ComponentProps<"ol">) {
  return (
    <ol
      data-slot="comment-list"
      className={cn(
        "flex flex-col gap-container",
        "[&>li+li]:border-t [&>li+li]:border-border [&>li+li]:pt-container",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Who wrote the comment and when, on one line, with a middle dot between the parts. The dots are
 * hidden from a screen reader, which pauses between the parts instead. It wraps in a thread, and
 * stays on one line in a compact comment.
 */
function CommentHeader({ className, children, ...props }: ComponentProps<"div">) {
  const parts = Children.toArray(children);
  return (
    <div
      data-slot="comment-header"
      className={cn(
        "flex min-w-0 flex-wrap items-baseline gap-x-1.5 leading-snug text-muted-foreground",
        "group-data-[size=compact]/comment:flex-nowrap group-data-[size=compact]/comment:whitespace-nowrap",
        className,
      )}
      {...props}
    >
      {parts.flatMap((part, index) =>
        index === 0
          ? [part]
          : [
              <span key={`dot-${String(index)}`} aria-hidden>
                ·
              </span>,
              part,
            ],
      )}
    </div>
  );
}

/** The author's name. It is never cut short. */
function CommentAuthor({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="comment-author"
      className={cn(
        "whitespace-nowrap group-data-[size=default]/comment:font-medium group-data-[size=default]/comment:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** The author's role, such as "Registrar, GMU C". A compact comment leaves it out. */
function CommentRole({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="comment-role"
      className={cn("group-data-[size=compact]/comment:hidden", className)}
      {...props}
    />
  );
}

/** A `time` element's props: give `dateTime` the moment as ISO 8601, and the words as children. */
type CommentTimeProps = ComponentProps<"time">;

/**
 * When the comment was written, as words you format, such as "Mon 19 Oct, 06:00". Cadence never
 * reads the clock: give the time zone you formatted it in where readers could be in another.
 */
function CommentTime({ className, ...props }: CommentTimeProps) {
  return (
    <time
      data-slot="comment-time"
      className={cn("whitespace-nowrap tabular-nums", className)}
      {...props}
    />
  );
}

/**
 * What the comment says. In a thread it wraps and keeps its line breaks. In a compact comment it
 * is cut to one line, or two with `lines={2}`, so the whole text must be shown somewhere else.
 *
 * In a revoked comment the text is struck through and muted, and a screen reader hears "Revoked:"
 * before it, because a line through the words is not read out.
 */
function CommentText({ className, children, ...props }: ComponentProps<"p">) {
  const { size, status, lines } = use(CommentContext);
  return (
    <p
      data-slot="comment-text"
      className={cn(
        "min-w-0 leading-normal",
        size === "default" && "wrap-break-word whitespace-pre-line",
        size === "compact" && (lines === 2 ? "line-clamp-2" : "truncate"),
        status === "revoked" && "text-muted-foreground line-through",
        className,
      )}
      {...props}
    >
      {status === "revoked" ? <span className="sr-only">Revoked: </span> : null}
      {children}
    </p>
  );
}

/**
 * Says the comment was changed after it was posted: "Edited", unless you give other words. Put it
 * in the `CommentHeader`, after the time.
 */
function CommentEdited({ className, children, ...props }: ComponentProps<"span">) {
  return (
    <span data-slot="comment-edited" className={cn("whitespace-nowrap", className)} {...props}>
      {children ?? "Edited"}
    </span>
  );
}

/** A `p`'s props, plus who revoked the comment and when. */
interface CommentRevokedProps extends Omit<ComponentProps<"p">, "children"> {
  /** Who revoked it, such as "Dr Tom Ellis". */
  by: string;
  /** When, as words you format, such as "08:14". */
  time: ReactNode;
  /** When, in ISO 8601 with its offset, for the `time` element. */
  dateTime: string;
  /** The words before who revoked it. Defaults to "Revoked by". */
  label?: ReactNode;
}

/**
 * Says who revoked the comment and when, with an icon: "Revoked by Dr Tom Ellis, 08:14". Put it
 * after the text of a comment with `status="revoked"`. In a compact comment it is the icon and
 * "Revoked", in the header, and who and when are left to the thread.
 */
function CommentRevoked({
  by,
  time,
  dateTime,
  label = "Revoked by",
  className,
  ...props
}: CommentRevokedProps) {
  const { size } = use(CommentContext);
  const mark = <Ban aria-hidden data-icon="inline-start" />;
  const iconSize = "[&_svg]:size-[calc(var(--control-icon)*0.875)] [&_svg]:shrink-0";
  if (size === "compact") {
    return (
      <span
        data-slot="comment-revoked"
        className={cn("inline-flex items-center gap-1 whitespace-nowrap", iconSize, className)}
      >
        {mark}
        Revoked
      </span>
    );
  }
  return (
    <p
      data-slot="comment-revoked"
      className={cn(
        "flex flex-wrap items-center gap-x-1 text-muted-foreground",
        iconSize,
        className,
      )}
      {...props}
    >
      {mark}
      <span>
        {label} <span className="text-foreground">{by}</span>
        {", "}
        <time dateTime={dateTime} className="whitespace-nowrap tabular-nums">
          {time}
        </time>
      </span>
    </p>
  );
}

/**
 * The actions the reader can take on the comment, such as Edit and Delete while its author still
 * may, or Revoke once they may not. Buttons, and words such as how long is left to edit, on one
 * line that wraps. A compact comment leaves its actions to the thread.
 */
function CommentActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="comment-actions"
      className={cn(
        "flex flex-wrap items-center gap-x-control-gap gap-y-1 text-muted-foreground",
        "group-data-[size=compact]/comment:hidden",
        className,
      )}
      {...props}
    />
  );
}

/** One source a drafted comment was drawn from: its name, and where to open it. */
interface CommentSource {
  label: string;
  href?: string;
}

/** A `div`'s props, plus who drafted the comment, who reviewed it and what it was drawn from. */
interface CommentProvenanceProps extends Omit<ComponentProps<"div">, "children"> {
  /** What drafted the text, such as "Handover assistant". */
  drafter: string;
  /** Who reviewed the draft. Leave it out while nobody has. */
  reviewedBy?: string;
  /** What the draft was drawn from. An empty list is shown as having no source. */
  sources: readonly CommentSource[];
  /** The words before the drafter. Defaults to "Drafted by AI:". */
  label?: ReactNode;
}

/**
 * Marks a comment that an AI drafted: what drafted it, who reviewed it, and the sources it was
 * drawn from, each a link where it has one. A comment with no source says so. The mark is an icon
 * and words, never colour alone, and it stays once the comment is reviewed.
 *
 * In a compact comment it is the icon and "AI draft", and the rest is left to the thread. Cadence
 * shows the provenance it is given and never works it out.
 */
function CommentProvenance({
  drafter,
  reviewedBy,
  sources,
  label = "Drafted by AI:",
  className,
  ...props
}: CommentProvenanceProps) {
  const { size } = use(CommentContext);
  const mark = <Sparkles aria-hidden data-icon="inline-start" className="text-primary-text" />;
  if (size === "compact") {
    return (
      <span
        data-slot="comment-provenance"
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap [&_svg]:size-[calc(var(--control-icon)*0.875)] [&_svg]:shrink-0",
          className,
        )}
      >
        {mark}
        AI draft
      </span>
    );
  }
  return (
    <div
      data-slot="comment-provenance"
      className={cn(
        "flex flex-col gap-0.5 rounded-md border border-border px-container-sm py-1 text-muted-foreground",
        "[&_svg]:size-[calc(var(--control-icon)*0.875)] [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      <p className="flex flex-wrap items-center gap-x-1">
        {mark}
        <span className="text-foreground">{label}</span>
        <span>{`${drafter}, ${reviewedBy ? `reviewed by ${reviewedBy}` : "not reviewed yet"}`}</span>
      </p>
      {sources.length === 0 ? (
        <p>No source</p>
      ) : (
        <p className="wrap-break-word">
          {"Sources: "}
          {sources.map((source, index) => (
            <span key={`${source.label}-${String(index)}`}>
              {index > 0 ? ", " : null}
              {source.href ? (
                <a
                  href={source.href}
                  className="rounded-sm text-primary-text underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {source.label}
                </a>
              ) : (
                source.label
              )}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

export {
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
};
export type {
  CommentLines,
  CommentProps,
  CommentProvenanceProps,
  CommentRevokedProps,
  CommentSize,
  CommentSource,
  CommentStatus,
  CommentTimeProps,
};
