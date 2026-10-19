"use client";

import { ModeToggle, type Mode, type ModeToggleProps } from "@cadence-clinical/ui";
import { useState } from "react";

/**
 * A Mode toggle for the docs. This site has its own mode switch, so the preview is controlled: it
 * shows the mode chosen beside it and leaves the page as it is.
 */
export function ModeTogglePreview(props: Omit<ModeToggleProps, "value" | "onValueChange">) {
  const [mode, setMode] = useState<Mode>("system");
  return (
    <div className="not-prose preview-surface my-6 flex min-h-32 flex-wrap items-center justify-center gap-3 rounded-lg border p-6">
      <ModeToggle {...props} value={mode} onValueChange={setMode} />
      <p className="text-muted-foreground" aria-live="polite">{`Chosen: ${mode}`}</p>
    </div>
  );
}
