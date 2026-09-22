import { cva, type VariantProps } from "class-variance-authority";
import { CircleCheck, Info, OctagonAlert, TriangleAlert } from "lucide-react";
import type { ComponentProps, ReactElement } from "react";

import { cn } from "@/lib/cn";

const alertVariants = cva(
  // The alert measures itself, so its action can drop under the words when there is no room.
  "group/alert @container/alert w-full rounded-lg border px-(--container-padding) py-(--container-padding-sm) text-left text-body",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        critical: "border-critical-border bg-critical-subtle text-foreground",
        warning: "border-warning-border bg-warning-subtle text-foreground",
        success: "border-success-border bg-success-subtle text-foreground",
        info: "border-info-border bg-info-subtle text-foreground",
      },
      emphasis: {
        outlined: "",
        // Quieter, for a note beside what it is about: the fill stays, and the outline becomes a
        // bar down the leading edge, in the same border token.
        edge: "rounded-md border-0 border-s-4",
      },
    },
    compoundVariants: [
      // Without a status there is no status border to draw the bar in, so it is the page's rule
      // on the muted fill, which the token tests hold at 4.5:1 for text.
      { variant: "default", emphasis: "edge", class: "border-s-border bg-muted text-foreground" },
    ],
    defaultVariants: { variant: "default", emphasis: "outlined" },
  },
);

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>["variant"]>;

/**
 * What marks each status besides its colour. The outlines differ, not only the glyphs: an "i" and
 * an "!" in the same circle are too alike to tell apart at a glance.
 */
const STATUS = {
  critical: { icon: <OctagonAlert />, label: "Critical", role: "alert" },
  warning: { icon: <TriangleAlert />, label: "Warning", role: "alert" },
  success: { icon: <CircleCheck />, label: "Success", role: "status" },
  info: { icon: <Info />, label: "Information", role: "status" },
  default: { icon: undefined, label: undefined, role: "status" },
} as const satisfies Record<AlertVariant, unknown>;

/** A `div`'s props, plus `variant`, `emphasis`, `icon` and `iconLabel`. */
type AlertProps = ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    /** Replaces the variant's icon. A status variant always has one. */
    icon?: ReactElement;
    /** What a screen reader says in place of the icon. It defaults to the variant's name. */
    iconLabel?: string;
  };

/**
 * A message that stands out from the page. A status variant carries its fill, its border, an icon
 * and the status in words for a screen reader, so the status never rests on colour.
 *
 * It is announced when it appears: `critical` and `warning` at once, the rest when the screen
 * reader is next idle. For a message that is on the page from the start, set `role`.
 */
function Alert({
  className,
  variant = "default",
  emphasis = "outlined",
  icon,
  iconLabel,
  role,
  children,
  ...props
}: AlertProps) {
  const status = STATUS[variant ?? "default"];
  const shownIcon = icon ?? status.icon;
  const label = iconLabel ?? status.label;
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      data-emphasis={emphasis}
      role={role ?? status.role}
      className={cn(alertVariants({ variant, emphasis }), className)}
      {...props}
    >
      <div
        data-slot="alert-layout"
        data-icon={shownIcon ? "" : undefined}
        className={cn(
          "grid grid-cols-[minmax(0,1fr)] gap-x-2 gap-y-0.5",
          "data-icon:grid-cols-[auto_minmax(0,1fr)]",
          "@sm/alert:has-data-[slot=alert-action]:grid-cols-[minmax(0,1fr)_auto]",
          "@sm/alert:data-icon:has-data-[slot=alert-action]:grid-cols-[auto_minmax(0,1fr)_auto]",
        )}
      >
        {shownIcon ? (
          <span
            data-slot="alert-icon"
            role={label ? "img" : undefined}
            aria-label={label}
            aria-hidden={label ? undefined : true}
            className={cn(
              // Centred on the title's first line, however many lines the title runs to.
              "mt-[calc((1lh-var(--control-icon))/2)] [&>svg]:size-control-icon",
              variant === "critical" && "text-critical-text",
              variant === "warning" && "text-warning-text",
              variant === "success" && "text-success-text",
              variant === "info" && "text-info-text",
            )}
          >
            {shownIcon}
          </span>
        ) : null}
        {children}
      </div>
    </div>
  );
}

/** What the alert is about, in a few words. */
function AlertTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium wrap-break-word group-data-[variant=critical]/alert:text-critical-text group-data-[variant=info]/alert:text-info-text group-data-[variant=success]/alert:text-success-text group-data-[variant=warning]/alert:text-warning-text",
        "[[data-icon]>&]:col-start-2",
        "[&_a]:underline [&_a]:underline-offset-4",
        className,
      )}
      {...props}
    />
  );
}

/** The message. It is body text at full contrast, on every fill. */
function AlertDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "wrap-break-word [[data-icon]>&]:col-start-2",
        "[&_a]:underline [&_a]:underline-offset-4 [&_p:not(:last-child)]:mb-2",
        className,
      )}
      {...props}
    />
  );
}

/**
 * What to do about it: a button or two. It sits at the end of the alert when there is room, and
 * under the words when there is not.
 */
function AlertAction({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn(
        "mt-1 flex flex-wrap items-center gap-2 [[data-icon]>&]:col-start-2",
        "@sm/alert:col-start-2 @sm/alert:row-span-2 @sm/alert:row-start-1 @sm/alert:mt-0 @sm/alert:self-start",
        "@sm/alert:[[data-icon]>&]:col-start-3",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertAction, AlertDescription, AlertTitle, alertVariants };
export type { AlertProps };
