"use client";

import { ChevronLeft } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ComponentProps,
  type RefObject,
} from "react";

import { Button, type ButtonProps } from "@/components/cadence/button";
import { cn } from "@/lib/cn";

/** Below Tailwind's `md` breakpoint one pane shows at a time, as the Sidebar becomes a sheet. */
const PHONE_QUERY = "(max-width: 767px)";

function subscribeToWidth(notify: () => void) {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", notify);
  return () => {
    query.removeEventListener("change", notify);
  };
}

function useIsPhone(): boolean {
  return useSyncExternalStore(
    subscribeToWidth,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
}

interface ListDetailContextValue {
  onBack: (() => void) | undefined;
  listRef: RefObject<HTMLElement | null>;
  detailRef: RefObject<HTMLElement | null>;
  /** The last thing in the list that had focus, which focus goes back to from the record. */
  lastInListRef: RefObject<HTMLElement | null>;
}

const ListDetailContext = createContext<ListDetailContextValue | null>(null);

function useListDetail(part: string): ListDetailContextValue {
  const context = useContext(ListDetailContext);
  if (!context) throw new Error(`${part} must be used inside a ListDetail.`);
  return context;
}

/** A `div`'s props, plus `open` and `onBack`. */
type ListDetailProps = ComponentProps<"div"> & {
  /** Whether a record is shown. On a phone, the record takes the list's place while it is. */
  open?: boolean;
  /** Called by `ListDetailBack`, on a phone, to show the list again. Clear the record here. */
  onBack?: () => void;
};

/**
 * A list beside the record chosen from it, which is how most clinical work is laid out. It holds
 * no content of its own: the list, the record and how a record is chosen are yours.
 *
 * From `md` up the two sit side by side, and each scrolls on its own. Inside an Application shell
 * it fills the height under the header. On a phone one shows at a time: the record replaces the
 * list while `open`, focus moves to it, and `ListDetailBack` brings the list back with focus where
 * it was.
 */
function ListDetail({ open = false, onBack, className, ...props }: ListDetailProps) {
  const isPhone = useIsPhone();
  const listRef = useRef<HTMLElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const lastInListRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(open);

  useEffect(() => {
    if (open === wasOpen.current) return;
    wasOpen.current = open;
    // Beside each other, both panes are in view, and focus stays where the user put it.
    if (!isPhone) return;
    if (open) {
      detailRef.current?.focus();
    } else {
      const last = lastInListRef.current;
      (last?.isConnected ? last : listRef.current)?.focus();
    }
  }, [open, isPhone]);

  const context = useMemo(() => ({ onBack, listRef, detailRef, lastInListRef }), [onBack]);
  return (
    <ListDetailContext value={context}>
      <div
        data-slot="list-detail"
        data-open={open ? "" : undefined}
        className={cn(
          "group/list-detail grid min-h-0 w-full grid-cols-[minmax(0,1fr)]",
          "md:h-[calc(100svh-var(--header-height,0px))] md:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]",
          className,
        )}
        {...props}
      />
    </ListDetailContext>
  );
}

/** The list. From `md` up it scrolls on its own, and on a phone it hides while a record is open. */
function ListDetailList({ className, ...props }: ComponentProps<"section">) {
  const { listRef, lastInListRef } = useListDetail("ListDetailList");

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const remember = (event: FocusEvent) => {
      if (event.target !== list && event.target instanceof HTMLElement) {
        lastInListRef.current = event.target;
      }
    };
    list.addEventListener("focusin", remember);
    return () => {
      list.removeEventListener("focusin", remember);
    };
  }, [listRef, lastInListRef]);

  return (
    <section
      data-slot="list-detail-list"
      tabIndex={-1}
      className={cn(
        "flex min-h-0 min-w-0 flex-col outline-none md:overflow-y-auto md:overscroll-contain md:border-r",
        "group-data-open/list-detail:hidden md:group-data-open/list-detail:flex",
        className,
      )}
      {...props}
      ref={listRef}
    />
  );
}

/** The record. From `md` up it scrolls on its own, and on a phone it shows only while open. */
function ListDetailDetail({ className, ...props }: ComponentProps<"section">) {
  const { detailRef } = useListDetail("ListDetailDetail");
  return (
    <section
      data-slot="list-detail-detail"
      tabIndex={-1}
      className={cn(
        "hidden min-h-0 min-w-0 flex-col outline-none group-data-open/list-detail:flex md:flex md:overflow-y-auto md:overscroll-contain",
        className,
      )}
      {...props}
      ref={detailRef}
    />
  );
}

/**
 * Brings the list back, on a phone, where the record has taken its place. It is not shown from
 * `md` up, where the list is in view. Name it by the list, such as "All referrals".
 */
function ListDetailBack({ className, onClick, children = "Back", ...props }: ButtonProps) {
  const { onBack } = useListDetail("ListDetailBack");
  return (
    <Button
      data-slot="list-detail-back"
      variant="ghost"
      size="sm"
      className={cn("self-start md:hidden", className)}
      onClick={(event) => {
        onClick?.(event);
        onBack?.();
      }}
      {...props}
    >
      <ChevronLeft aria-hidden data-icon="inline-start" />
      {children}
    </Button>
  );
}

export { ListDetail, ListDetailBack, ListDetailDetail, ListDetailList };
export type { ListDetailProps };
