import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Comment,
  CommentActions,
  CommentProvenance,
  CommentRevoked,
  CommentText,
  Field,
  FieldLabel,
  Textarea,
} from "@cadence-clinical/ui";
import { Ban, Pencil, Trash2 } from "lucide-react";
import {
  createContext,
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type SubmitEvent,
} from "react";

import { formatShortTime, wardClock, type Patient, type PatientComment } from "../ward";
import { USER } from "./app-sidebar";
import { displayName } from "./patient-identity";

/**
 * How long the author of a comment may still edit or delete it, in milliseconds (the maintainer's
 * rule, 2026-10-19). After that it can only be revoked, and a revoked comment stays in the thread.
 */
export const EDIT_WINDOW_MS = 10_000;

/** Whether the signed-in user wrote a comment: only the author gets its actions. */
function isOwn(comment: PatientComment): boolean {
  return comment.author === USER.name;
}

/** Whether a comment's author may still edit or delete it, by the prototype's clock. */
export function isEditable(comment: PatientComment, now: number): boolean {
  return isOwn(comment) && !comment.revoked && now - Date.parse(comment.at) < EDIT_WINDOW_MS;
}

/** What the thread asks of the list: adding, changing and revoking comments in this session. */
export interface CommentThreadActions {
  onAdd: (text: string) => void;
  onEdit: (commentId: string, text: string) => void;
  onDelete: (commentId: string) => void;
  onRevoke: (commentId: string) => void;
}

/** What each comment in the thread reads: the clock, which one is being edited, and the actions. */
interface ThreadState extends CommentThreadActions {
  now: number;
  editing: { id: string; text: string } | null;
  setEditing: (editing: { id: string; text: string } | null) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  requestRevoke: (commentId: string) => void;
  /** Sets the clock to now, so a comment just posted counts down from its full 10 seconds. */
  tick: () => void;
  /** Called when focus enters or leaves a comment's actions, so focus can follow to Revoke. */
  focusActions: (commentId: string | null) => void;
  /** Moves focus to the box to add a comment, as after a deletion. */
  focusBox: () => void;
}

const ThreadContext = createContext<ThreadState | null>(null);

function useThread(): ThreadState {
  const thread = use(ThreadContext);
  if (!thread) throw new Error("A thread's comment must be inside a CommentThreadProvider.");
  return thread;
}

/** Finds a comment's item in the page, by the `data-comment` its item carries. */
function commentItem(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-comment="${CSS.escape(id)}"]`);
}

/**
 * What a comment's item carries so the thread can move focus to it: the comment's id, and a place
 * in the focus order only for a script, with a ring when it has focus.
 */
export function commentItemProps(comment: PatientComment) {
  return {
    "data-comment": comment.id,
    tabIndex: -1,
    className: "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
  };
}

/**
 * The rules of one patient's comments, wherever they are shown: the author can edit or delete a
 * comment for ten seconds after posting it, with the time left beside the actions, and while they
 * are editing it the window stays open. After that the author can only revoke it, after a
 * confirmation, and it stays, struck through, saying who revoked it and when.
 *
 * It holds the clock, the comment being edited and the revocation being asked about, and moves
 * focus when Edit and Delete give way to Revoke. Each comment is drawn by a `ThreadComment` inside
 * an item that carries `commentItemProps`, and the box to add one is a `CommentComposer`.
 */
export function CommentThreadProvider({
  comments,
  onAdd,
  onEdit,
  onDelete,
  onRevoke,
  children,
}: {
  comments: readonly PatientComment[];
  children: ReactNode;
} & CommentThreadActions) {
  const [now, setNow] = useState(wardClock);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  // Where focus goes after the next render: a comment's first action, or the comment itself.
  const focusNext = useRef<{ id: string; on: "action" | "comment" } | null>(null);
  // The comment whose actions hold focus, and whether it could be edited at the last render, so
  // focus is kept when Edit and Delete give way to Revoke under it.
  const focusedActions = useRef<string | null>(null);
  const wasEditable = useRef<Record<string, boolean>>({});

  const isOpen = (comment: PatientComment) =>
    editing?.id === comment.id || isEditable(comment, now);
  const hasOpen = comments.some((comment) => isEditable(comment, now));

  // The clock ticks only while a comment can still be edited, to count down its seconds.
  useEffect(() => {
    if (!hasOpen) return;
    const timer = setInterval(() => {
      setNow(wardClock());
    }, 250);
    return () => {
      clearInterval(timer);
    };
  }, [hasOpen]);

  // Editing starts with the caret after the text, where a correction is usually made.
  const editingId = editing?.id;
  useLayoutEffect(() => {
    const field = document.querySelector<HTMLTextAreaElement>("[data-comment-editor]");
    if (editingId === undefined || !field) return;
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
  }, [editingId]);

  useLayoutEffect(() => {
    const focused = focusedActions.current;
    if (
      focused &&
      wasEditable.current[focused] &&
      !comments.find((c) => c.id === focused && isOpen(c))
    ) {
      // Edit and Delete have gone, and Revoke has taken their place: focus follows.
      if (document.activeElement === document.body || document.activeElement === null) {
        focusNext.current = { id: focused, on: "action" };
      }
    }
    wasEditable.current = Object.fromEntries(
      comments.map((comment) => [comment.id, isOpen(comment)]),
    );
    const next = focusNext.current;
    if (!next) return;
    focusNext.current = null;
    const item = commentItem(next.id);
    const action = item?.querySelector<HTMLElement>("[data-slot=comment-actions] button");
    (next.on === "action" ? (action ?? item) : item)?.focus();
  });

  const saveEdit = () => {
    if (!editing) return;
    const text = editing.text.trim();
    const comment = comments.find((c) => c.id === editing.id);
    if (comment && text !== "" && text !== comment.text) onEdit(editing.id, text);
    focusNext.current = { id: editing.id, on: "action" };
    setEditing(null);
    setNow(wardClock());
  };

  const cancelEdit = () => {
    if (!editing) return;
    focusNext.current = { id: editing.id, on: "action" };
    setEditing(null);
    setNow(wardClock());
  };

  const revokingComment = comments.find((comment) => comment.id === revoking);
  const state: ThreadState = {
    now,
    editing,
    setEditing,
    saveEdit,
    cancelEdit,
    requestRevoke: setRevoking,
    tick: () => {
      setNow(wardClock());
    },
    focusActions: (commentId) => {
      focusedActions.current = commentId;
    },
    onAdd,
    onEdit,
    onDelete,
    onRevoke,
    focusBox: () => {
      document.querySelector<HTMLElement>("[data-comment-box]")?.focus();
    },
  };

  return (
    <ThreadContext value={state}>
      {children}
      <AlertDialog
        open={revoking !== null}
        onOpenChange={(open) => {
          if (!open) setRevoking(null);
        }}
      >
        <AlertDialogContent
          // The Revoke button goes once the comment is revoked, so the thread moves focus to the
          // comment itself, and the dialog leaves focus alone.
          finalFocus={false}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke your comment?</AlertDialogTitle>
            <AlertDialogDescription>
              {`“${revokingComment?.text ?? ""}” stays, struck through, with your name and the time you revoked it. You cannot undo this.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!revoking) return;
                focusNext.current = { id: revoking, on: "comment" };
                onRevoke(revoking);
              }}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ThreadContext>
  );
}

/**
 * One comment's text and marks, with its author's actions: what a thread shows under the
 * comment's header. The header (who, their role, when, and "Edited") is the item's to show, such
 * as a timeline item's. Put it in an item that carries `commentItemProps`.
 */
export function ThreadComment({ comment }: { comment: PatientComment }) {
  const thread = useThread();
  const isEditing = thread.editing?.id === comment.id;
  const isOpenNow = isEditing || isEditable(comment, thread.now);
  const left = Math.min(
    EDIT_WINDOW_MS / 1000,
    Math.max(1, Math.ceil((EDIT_WINDOW_MS - (thread.now - Date.parse(comment.at))) / 1000)),
  );
  return (
    <Comment status={comment.revoked ? "revoked" : "active"}>
      {isEditing ? (
        <Field>
          <FieldLabel className="sr-only">Edit your comment</FieldLabel>
          <Textarea
            data-comment-editor
            rows={2}
            value={thread.editing?.text ?? ""}
            onChange={(event) => {
              thread.setEditing({ id: comment.id, text: event.target.value });
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                thread.cancelEdit();
              } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                thread.saveEdit();
              }
            }}
          />
        </Field>
      ) : (
        <CommentText>{comment.text}</CommentText>
      )}
      {comment.drafted ? (
        <CommentProvenance
          drafter={comment.drafted.drafter}
          reviewedBy={comment.drafted.reviewedBy ?? undefined}
          sources={comment.drafted.sources.map((label) => ({ label }))}
        />
      ) : null}
      {comment.revoked ? (
        <CommentRevoked
          by={comment.revoked.by}
          time={formatShortTime(comment.revoked.at)}
          dateTime={comment.revoked.at}
        />
      ) : null}
      {isOwn(comment) && !comment.revoked ? (
        <CommentActions
          onFocus={() => {
            thread.focusActions(comment.id);
          }}
          onBlur={(event) => {
            // Focus that moves on elsewhere is let go. Focus lost because the button went away
            // has no next target, and is kept so it can follow to Revoke.
            if (event.relatedTarget !== null) thread.focusActions(null);
          }}
        >
          {isEditing ? (
            <>
              <Button size="sm" onClick={thread.saveEdit}>
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={thread.cancelEdit}>
                Cancel
              </Button>
              <span>Kept open while you edit</span>
            </>
          ) : isOpenNow ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Edit your comment: ${comment.text}`}
                onClick={() => {
                  thread.setEditing({ id: comment.id, text: comment.text });
                }}
              >
                <Pencil aria-hidden data-icon="inline-start" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Delete your comment: ${comment.text}`}
                onClick={() => {
                  thread.onDelete(comment.id);
                  thread.focusBox();
                }}
              >
                <Trash2 aria-hidden data-icon="inline-start" />
                Delete
              </Button>
              {/* A timer is not read out as it changes, only when a reader reaches it. */}
              <span role="timer" className="tabular-nums">
                {`Editable for ${String(left)} s`}
              </span>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Revoke your comment: ${comment.text}`}
              onClick={() => {
                thread.requestRevoke(comment.id);
              }}
            >
              <Ban aria-hidden data-icon="inline-start" />
              Revoke
            </Button>
          )}
        </CommentActions>
      ) : null}
    </Comment>
  );
}

/**
 * The box to add a comment, posted by the signed-in user at the prototype's clock. The draft is
 * the list's to keep, patient by patient, so a draft never follows the pane to another patient.
 * Ctrl or Cmd and Enter posts it.
 */
export function CommentComposer({
  patient,
  draft,
  onDraftChange,
  onPosted,
}: {
  patient: Patient;
  draft: string;
  onDraftChange: (draft: string) => void;
  /** Called after posting, such as to show the new comment. */
  onPosted?: () => void;
}) {
  const thread = useThread();
  const post = () => {
    const text = draft.trim();
    if (text === "") return;
    thread.onAdd(text);
    onDraftChange("");
    thread.tick();
    onPosted?.();
  };
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    post();
  };
  return (
    // The button sits beside the box, so the box and its action take as little of the pane's
    // height as they can, and the timeline above keeps the room.
    <form onSubmit={submit} className="flex items-end gap-control-gap">
      <Field className="min-w-0 flex-1">
        <FieldLabel>
          Add a comment<span className="sr-only">{` for ${displayName(patient)}`}</span>
        </FieldLabel>
        <Textarea
          data-comment-box
          rows={2}
          value={draft}
          onChange={(event) => {
            onDraftChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              post();
            }
          }}
        />
      </Field>
      <Button type="submit" disabled={draft.trim() === ""}>
        Post
      </Button>
    </form>
  );
}
