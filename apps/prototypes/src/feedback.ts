const STORAGE_KEY = "cadence-feedback";

/**
 * Whether this visitor asked to leave feedback. Opening the site with `?feedback` turns it on and
 * remembers it, and `?feedback=off` turns it off. Storage can be blocked, so a failed read or write
 * only means it isn't remembered.
 */
function feedbackRequested(): boolean {
  const asked = new URLSearchParams(window.location.search).get("feedback");
  try {
    if (asked === "off") {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    if (asked !== null) localStorage.setItem(STORAGE_KEY, "on");
    return asked !== null || localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return asked !== null && asked !== "off";
  }
}

/**
 * Mounts the Vercel Toolbar, so a tester can comment on the page, only for a visitor who asked for
 * it: anyone else would be asked to sign in to Vercel. Preview deployments show the toolbar to the
 * team without this. It loads on its own, so the prototypes don't carry it for everyone.
 */
export function mountFeedbackToolbar(): void {
  if (!feedbackRequested()) return;
  void import("@vercel/toolbar/vite").then(({ mountVercelToolbar }) => {
    mountVercelToolbar();
  });
}
