import { useSyncExternalStore } from "react";

function subscribe(notify: () => void) {
  window.addEventListener("hashchange", notify);
  return () => {
    window.removeEventListener("hashchange", notify);
  };
}

/**
 * The current route, read from the URL's hash (`#/patient-list/a`), so the deployed site is plain
 * static files with no server routes.
 */
export function useRoute(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.hash.replace(/^#/, "") || "/",
    () => "/",
  );
}
