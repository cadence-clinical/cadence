"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";
import { Fieldset as FieldsetPrimitive } from "@base-ui/react/fieldset";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert } from "lucide-react";
import { createContext, useContext, type ComponentProps, type ReactNode } from "react";

import { Label } from "@/components/cadence/label";
import { cn } from "@/lib/cn";

/** Whether a Field is already open around this one, which makes this one an option in a set. */
const InsideFieldContext = createContext(false);

/**
 * A set of related fields, or the options of one question, under a `FieldLegend`. Disabling it
 * disables every control inside, including the Base UI ones a native `fieldset` cannot reach.
 */
function FieldSet({ className, ...props }: FieldsetPrimitive.Root.Props) {
  return (
    <FieldsetPrimitive.Root
      data-slot="field-set"
      // A fieldset is as wide as its longest word unless it is told otherwise.
      className={cn("flex min-w-0 flex-col gap-container", className)}
      {...props}
    />
  );
}

/** The Base UI Fieldset Legend's props, plus `variant`. */
type FieldLegendProps = FieldsetPrimitive.Legend.Props & {
  /** `legend` heads a set of fields. `label` reads as the label of one question. */
  variant?: "legend" | "label";
};

/** Names a `FieldSet`. As a `label` it sits as close to its options as a label does to a control. */
function FieldLegend({ className, variant = "legend", ...props }: FieldLegendProps) {
  return (
    <FieldsetPrimitive.Legend
      data-slot="field-legend"
      data-variant={variant}
      render={<legend />}
      className={cn(
        "leading-snug font-medium wrap-break-word",
        "data-[variant=label]:mb-1 data-[variant=label]:text-control",
        "data-[variant=legend]:mb-2 data-[variant=legend]:text-title",
        className,
      )}
      {...props}
    />
  );
}

/** A column of fields, spaced by the density. It is also what a `responsive` Field measures. */
function FieldGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-container",
        // A group inside a group is a list of options, which sit closer than fields do.
        "*:data-[slot=field-group]:gap-2",
        className,
      )}
      {...props}
    />
  );
}

const fieldVariants = cva("group/field flex w-full gap-1", {
  variants: {
    orientation: {
      vertical: "flex-col",
      horizontal: [
        "flex-row items-center gap-2",
        "*:data-[slot=field-label]:flex-auto",
        // Beside a title and its description, the control lines up with the title's first line.
        "has-[>[data-slot=field-content]]:items-start",
        "has-[>[data-slot=field-content]]:[&>:is([role=checkbox],[role=radio])]:mt-px",
      ],
      responsive: [
        "flex-col",
        "@md/field-group:flex-row @md/field-group:items-center @md/field-group:gap-2 @md/field-group:*:w-auto",
        "@md/field-group:*:data-[slot=field-label]:flex-auto",
        "@md/field-group:has-[>[data-slot=field-content]]:items-start",
        "@md/field-group:has-[>[data-slot=field-content]]:[&>:is([role=checkbox],[role=radio])]:mt-px",
      ],
    },
  },
  defaultVariants: { orientation: "vertical" },
});

/** The Base UI Field Root's props, plus `orientation`. */
type FieldProps = FieldPrimitive.Root.Props & VariantProps<typeof fieldVariants>;

/**
 * One control with its label, description and error. It ties them together: the label names the
 * control, the description and the error describe it, and `invalid` marks it, so none of that is
 * wired by hand. The label sits 4px above the control.
 *
 * A Field inside a Field is one option of a set, such as one radio with its label.
 */
function Field({ className, orientation = "vertical", ...props }: FieldProps) {
  const inside = useContext(InsideFieldContext);
  const shared = {
    "data-slot": "field",
    "data-orientation": orientation,
    className: cn(fieldVariants({ orientation }), className),
  };
  if (inside) {
    // The set's Field owns the name and the validity. An option has neither of its own.
    const {
      name: _name,
      validate: _validate,
      validationMode: _validationMode,
      validationDebounceTime: _validationDebounceTime,
      invalid: _invalid,
      dirty: _dirty,
      touched: _touched,
      actionsRef: _actionsRef,
      ...option
    } = props;
    return <FieldPrimitive.Item {...shared} {...option} />;
  }
  return (
    <InsideFieldContext value>
      <FieldPrimitive.Root {...shared} {...props} />
    </InsideFieldContext>
  );
}

/** A title and description stacked beside a control, in a horizontal Field. */
function FieldContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        "group/field-content flex min-w-0 flex-1 flex-col gap-0.5 leading-snug",
        className,
      )}
      {...props}
    />
  );
}

/** Names the Field's control. It is a `Label`, and it needs no `htmlFor`. */
function FieldLabel({ className, ...props }: FieldPrimitive.Label.Props) {
  return (
    <FieldPrimitive.Label
      data-slot="field-label"
      render={<Label />}
      // Only the words are the target, not the width of the form. A label is a flex container,
      // where text with nowhere to break only wraps if it may break anywhere.
      className={cn("w-fit wrap-anywhere data-disabled:opacity-50", className)}
      {...props}
    />
  );
}

/** Text that looks like a label and names nothing: a heading for content that is not a control. */
function FieldTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-2 text-control leading-snug font-medium",
        "group-data-disabled/field:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

/** Help for the control. A screen reader reads it after the control's name. */
function FieldDescription({ className, ...props }: FieldPrimitive.Description.Props) {
  return (
    <FieldPrimitive.Description
      data-slot="field-description"
      className={cn(
        "text-left text-control leading-normal font-normal wrap-break-word text-muted-foreground",
        "[[data-variant=legend]+&]:-mt-1",
        "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** A rule between fields, with optional words in the middle of it, such as "or". */
function FieldSeparator({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="field-separator"
      className={cn("flex items-center gap-2 text-control text-muted-foreground", className)}
      {...props}
    >
      {/* Two rules either side of the words, so no patch of background has to match a card. */}
      <span aria-hidden className="h-px flex-1 bg-border" />
      {children ? <span data-slot="field-separator-content">{children}</span> : null}
      {children ? <span aria-hidden className="h-px flex-1 bg-border" /> : null}
    </div>
  );
}

/** One message from a form library, such as React Hook Form or a schema's issue. */
interface FieldErrorMessage {
  message?: string;
}

/** The Base UI Field Error's props, plus `errors`. */
type FieldErrorProps = FieldPrimitive.Error.Props & {
  /** Messages from a form library. Repeats are shown once, and entries without one are skipped. */
  errors?: readonly (FieldErrorMessage | undefined)[];
};

/** One message as text, several as a list. */
function messagesOf(errors: FieldErrorProps["errors"]): ReactNode {
  const messages = [...new Set(errors?.map((error) => error?.message))].filter(
    (message) => message !== undefined && message !== "",
  );
  if (messages.length === 0) return undefined;
  if (messages.length === 1) return messages[0];
  return (
    <ul>
      {messages.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  );
}

/**
 * What is wrong, in words and with an icon, so it does not rely on colour. It is announced when it
 * appears, and read again with the control.
 *
 * Given a message, through `children` or `errors`, it shows it: render it only while the value is
 * wrong. Given none, it shows the message from the Field's own validation, when there is one.
 */
function FieldError({ className, children, errors, match, ...props }: FieldErrorProps) {
  const message = children ?? messagesOf(errors);
  const given = message !== undefined && message !== null;
  return (
    <FieldPrimitive.Error
      data-slot="field-error"
      role="alert"
      match={match ?? (given ? true : undefined)}
      className={cn(
        "flex items-start gap-control-gap text-control leading-snug font-normal text-critical-text",
        "[&_ul]:ml-4 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1",
        className,
      )}
      render={({ children: shown, ...rendered }) => (
        <div {...rendered}>
          <CircleAlert
            aria-hidden
            // Centred on the first line, however many lines the message runs to.
            className="mt-[calc((1lh-var(--control-icon))/2)] size-control-icon shrink-0"
          />
          <div className="min-w-0 flex-1 wrap-break-word">{shown}</div>
        </div>
      )}
      {...props}
      // Base UI supplies its own message as `children`, and an explicit `undefined` would
      // overrule it, so ours is passed only when there is one.
      {...(given ? { children: message } : {})}
    />
  );
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
};
export type { FieldErrorMessage, FieldErrorProps, FieldLegendProps, FieldProps };
