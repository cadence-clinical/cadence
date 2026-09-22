import type { ReactNode } from "react";

/** Frames a live component in a docs page. */
export function ComponentPreview({ children }: { children: ReactNode }) {
  return (
    <div className="not-prose preview-surface my-6 flex min-h-32 flex-wrap items-center justify-center gap-3 rounded-lg border p-6">
      {children}
    </div>
  );
}
