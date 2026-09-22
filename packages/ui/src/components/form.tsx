"use client";

import { Form as FormPrimitive } from "@base-ui/react/form";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";

import { Alert, AlertDescription, AlertTitle, type AlertProps } from "@/components/cadence/alert";
import { Button, type ButtonProps } from "@/components/cadence/button";
import { Spinner } from "@/components/cadence/spinner";
import { cn } from "@/lib/cn";

interface FormContextValue {
  /** The form element's id, which the error summary reads the fields from. */
  id: string;
  /** How many times the form has been sent, counted again from 0 when it is reset. */
  attempts: number;
  /** Whether the form was given errors from outside, such as a server's. */
  hasErrors: boolean;
  /**
   * Whether the last attempt to send is still owed a move of focus to its problems. It is
   * owed until the user presses a key or a pointer in the form, and asking settles it.
   */
  claimFocus: () => boolean;
}

const FormContext = createContext<FormContextValue | null>(null);

function useFormContext(part: string): FormContextValue {
  const context = useContext(FormContext);
  if (!context) throw new Error(`${part} must be used inside a Form.`);
  return context;
}

/** The Base UI Form's props. `Values` types what `onFormSubmit` receives. */
type FormProps<Values extends Record<string, unknown> = Record<string, unknown>> =
  FormPrimitive.Props<Values>;

/**
 * A native form, with Base UI's handling of errors: each Field is checked when the form is sent,
 * and the form is not sent while one is wrong. Errors from a server go in `errors`, by field name.
 *
 * With a `FormErrorSummary` inside it, a failed attempt moves focus to the summary. Without one,
 * it moves focus to the first field that is wrong, as Base UI does.
 */
function Form<Values extends Record<string, unknown> = Record<string, unknown>>({
  id,
  className,
  errors,
  onSubmitCapture,
  onReset,
  onKeyDownCapture,
  onPointerDownCapture,
  ...props
}: FormProps<Values>) {
  const generatedId = useId();
  const formId = id ?? generatedId;
  const [attempts, setAttempts] = useState(0);
  const owedFocus = useRef(false);

  const claimFocus = useCallback(() => {
    const owed = owedFocus.current;
    owedFocus.current = false;
    return owed;
  }, []);

  const hasErrors = errors !== undefined && Object.keys(errors).length > 0;
  const context = useMemo(
    () => ({ id: formId, attempts, hasErrors, claimFocus }),
    [formId, attempts, hasErrors, claimFocus],
  );

  // The user has moved on, so problems that arrive later do not take focus from them.
  const moveOn = () => {
    owedFocus.current = false;
  };

  return (
    <FormContext value={context}>
      <FormPrimitive<Values>
        id={formId}
        data-slot="form"
        errors={errors}
        className={cn("flex w-full min-w-0 flex-col gap-container", className)}
        // Capture runs before Base UI checks the fields, so an attempt that fails is counted too.
        onSubmitCapture={(event) => {
          owedFocus.current = true;
          setAttempts((count) => count + 1);
          onSubmitCapture?.(event);
        }}
        // React resets a form itself when its action finishes, so this leaves the focus owed.
        onReset={(event) => {
          setAttempts(0);
          onReset?.(event);
        }}
        onKeyDownCapture={(event) => {
          moveOn();
          onKeyDownCapture?.(event);
        }}
        onPointerDownCapture={(event) => {
          moveOn();
          onPointerDownCapture?.(event);
        }}
        {...props}
      />
    </FormContext>
  );
}

/** One field that is wrong, as the error summary lists it. */
interface FormProblem {
  /** What is wrong, in the words of the field's error, or the field's label when it has none. */
  message: string;
  /** The field's first control that takes focus, which its link moves focus to. */
  control: HTMLElement | null;
  /** The whole Field, brought into view with its label. */
  field: HTMLElement;
}

const NO_PROBLEMS: readonly FormProblem[] = [];
const FIELD = '[data-slot="field"]';
const FOCUSABLE = 'input:not([type="hidden"]), select, textarea, button, [tabindex]';

function textOf(element: Element): string {
  return element.textContent.replace(/\s+/g, " ").trim();
}

/** Reads the Fields that are wrong from the form, in the order they appear in it. */
function problemsIn(form: HTMLElement): FormProblem[] {
  const problems: FormProblem[] = [];
  for (const field of form.querySelectorAll<HTMLElement>(`${FIELD}[data-invalid]`)) {
    // An option of a set is a Field inside the set's Field, and the set's Field owns the error.
    if (field.parentElement?.closest(FIELD)) continue;
    const ownedByField = (element: Element) => element.closest(FIELD) === field;

    const control =
      [...field.querySelectorAll<HTMLElement>(FOCUSABLE)].find(
        (element) =>
          element.tabIndex >= 0 &&
          !element.matches(":disabled") &&
          element.closest('[aria-hidden="true"]') === null,
      ) ?? null;

    const messages = [...field.querySelectorAll('[data-slot="field-error"]')]
      .filter(ownedByField)
      .flatMap((error) => {
        const items = [...error.querySelectorAll("li")];
        return items.length > 0 ? items.map(textOf) : [textOf(error)];
      })
      .filter((message) => message !== "");

    if (messages.length === 0) {
      const label = [
        ...field.querySelectorAll('[data-slot="field-label"], [data-slot="field-legend"]'),
      ].find(ownedByField);
      if (label) messages.push(textOf(label));
    }
    for (const message of messages) problems.push({ message, control, field });
  }
  return problems;
}

function sameProblems(a: readonly FormProblem[], b: readonly FormProblem[]): boolean {
  return (
    a.length === b.length &&
    a.every((problem, index) => {
      const other = b[index];
      return (
        other !== undefined &&
        problem.message === other.message &&
        problem.control === other.control &&
        problem.field === other.field
      );
    })
  );
}

/** The Fields in the form that are wrong now, kept in step with the page. */
function useProblems(formId: string): readonly FormProblem[] {
  const last = useRef<readonly FormProblem[]>(NO_PROBLEMS);

  const subscribe = useCallback(
    (notify: () => void) => {
      const form = document.getElementById(formId);
      if (!form) return () => undefined;
      // A Field marks itself `data-invalid`, and its error is added or taken away.
      const observer = new MutationObserver(notify);
      observer.observe(form, {
        subtree: true,
        childList: true,
        characterData: true,
        attributeFilter: ["data-invalid", "id"],
      });
      return () => {
        observer.disconnect();
      };
    },
    [formId],
  );

  const getSnapshot = useCallback(() => {
    const form = document.getElementById(formId);
    const next = form ? problemsIn(form) : NO_PROBLEMS;
    if (!sameProblems(last.current, next)) last.current = next;
    return last.current;
  }, [formId]);

  return useSyncExternalStore(subscribe, getSnapshot, () => NO_PROBLEMS);
}

function titleFor(count: number): string {
  return count === 1 ? "There is a problem" : `There are ${String(count)} problems`;
}

/** An Alert's props, plus `title`. */
type FormErrorSummaryProps = Omit<AlertProps, "variant" | "title"> & {
  /** Heads the list. It defaults to "There is a problem", or the number when there are more. */
  title?: ReactNode;
};

/**
 * Every problem in the form, in one place at the top of it. Each is the Field's own error, and a
 * link that moves focus to the Field's control.
 *
 * It appears once the form has been sent, or given `errors`, and lists what is wrong at that
 * moment: a problem the user fixes leaves the list. When an attempt to send fails, focus moves
 * here, so a screen reader hears how many problems there are before it hears the first.
 */
function FormErrorSummary({ title, className, ...props }: FormErrorSummaryProps) {
  const { id, attempts, hasErrors, claimFocus } = useFormContext("FormErrorSummary");
  const problems = useProblems(id);
  const titleId = useId();
  const summary = useRef<HTMLDivElement>(null);
  const shown = (attempts > 0 || hasErrors) && problems.length > 0;

  useEffect(() => {
    if (shown && claimFocus()) summary.current?.focus();
  }, [shown, attempts, problems, claimFocus]);

  if (!shown) return null;
  return (
    <Alert
      ref={summary}
      data-slot="form-error-summary"
      variant="critical"
      // Focus brings the user here, so it is not also announced as an alert.
      role="group"
      aria-labelledby={titleId}
      tabIndex={-1}
      className={cn(
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      {...props}
    >
      <AlertTitle id={titleId}>{title ?? titleFor(problems.length)}</AlertTitle>
      <AlertDescription>
        <ul data-slot="form-error-summary-list" className="flex flex-col gap-1">
          {problems.map((problem, index) => (
            // Two problems can share a message, and the list is read afresh on every change.
            <li key={index}>
              {problem.control ? (
                <a
                  href={`#${problem.control.id}`}
                  className="rounded-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  onClick={(event) => {
                    event.preventDefault();
                    problem.control?.focus({ preventScroll: true });
                    // The whole Field, so its label is in view above the control.
                    problem.field.scrollIntoView({ block: "center" });
                  }}
                >
                  {problem.message}
                </a>
              ) : (
                problem.message
              )}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

/** The form's buttons, in a row that wraps when it runs out of room. Put the main one first. */
function FormActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="form-actions"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

/** A Button's props without `type`, plus `pending` and `pendingLabel`. */
type FormSubmitProps = Omit<ButtonProps, "type"> & {
  /** Whether the form is being sent. It follows the form's `action` unless you set it. */
  pending?: boolean;
  /** What the button says while the form is sent, such as "Saving". It defaults to its label. */
  pendingLabel?: ReactNode;
};

/**
 * Sends the form. While the form's `action` runs, it is disabled and shows a spinner, so the same
 * record cannot be sent twice. It stays focusable while disabled, so focus is not lost.
 */
function FormSubmit({
  pending,
  pendingLabel,
  disabled,
  focusableWhenDisabled = true,
  children,
  ...props
}: FormSubmitProps) {
  const status = useFormStatus();
  const sending = pending ?? status.pending;
  return (
    <Button
      data-slot="form-submit"
      type="submit"
      disabled={disabled === true || sending}
      focusableWhenDisabled={focusableWhenDisabled}
      {...props}
    >
      {sending ? (
        <>
          <Spinner aria-hidden data-icon="inline-start" />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export { Form, FormActions, FormErrorSummary, FormSubmit };
export type { FormErrorSummaryProps, FormProps, FormSubmitProps };
