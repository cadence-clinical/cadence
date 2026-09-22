import { Alert, AlertDescription, AlertTitle } from "@cadence-clinical/ui";
import type { ComponentProps, ReactNode } from "react";

/** The callout types a docs page can ask for, against Cadence's statuses. */
const VARIANTS = {
  info: "info",
  idea: "info",
  warn: "warning",
  warning: "warning",
  error: "critical",
  success: "success",
} as const;

type CalloutProps = Omit<ComponentProps<typeof Alert>, "title" | "variant"> & {
  type?: keyof typeof VARIANTS;
  title?: ReactNode;
};

/**
 * A note beside what it is about, on a documentation page. It is Cadence's own Alert in its
 * quieter style, in place of the one Fumadocs ships, so the site is built from what it documents.
 *
 * It is a note, not an announcement: it is on the page from the start, so it does not take the
 * alert role that an Alert appearing in an app would.
 */
export function Callout({ type = "info", title, children, ...props }: CalloutProps) {
  return (
    <Alert
      variant={VARIANTS[type]}
      emphasis="edge"
      role="note"
      className="not-prose my-6"
      {...props}
    >
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
