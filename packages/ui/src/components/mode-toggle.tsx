"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

import { Button, type ButtonProps } from "@/components/cadence/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";

/** A colour mode: `light` or `dark`, or `system` to follow the device's setting. */
type Mode = "light" | "dark" | "system";

/** The mode the page is shown in: a chosen mode, or the device's setting under `system`. */
type ResolvedMode = "light" | "dark";

/** Where the chosen mode is remembered in `localStorage`. `system` is remembered as no entry. */
const MODE_STORAGE_KEY = "cadence-mode";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Whether a value is a mode that is stored and set on the page: `light` or `dark`. */
function isSetMode(value: unknown): value is ResolvedMode {
  return value === "light" || value === "dark";
}

/**
 * The script that applies a remembered mode before the page is first painted, so a reload does not
 * flash the other mode. Put it in a `<script>` in the page's `<head>`, before the stylesheets. It
 * sets only `light` or `dark`, and does nothing when storage is unavailable.
 */
const MODE_SCRIPT = `try{var m=localStorage.getItem(${JSON.stringify(MODE_STORAGE_KEY)});if(m==="light"||m==="dark")document.documentElement.setAttribute("data-mode",m)}catch(e){}`;

/** The mode chosen on the page: `data-mode` on `<html>`, or `system` when it is not set. */
function getMode(): Mode {
  const value = document.documentElement.getAttribute("data-mode");
  return isSetMode(value) ? value : "system";
}

/**
 * The mode the page is shown in. A chosen mode wins, then a `dark` or `light` class on `<html>`,
 * which the tokens also follow, then the device's setting.
 */
function getResolvedMode(): ResolvedMode {
  const mode = getMode();
  if (mode !== "system") return mode;
  const root = document.documentElement.classList;
  if (root.contains("dark")) return "dark";
  if (root.contains("light")) return "light";
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/**
 * Sets the colour mode on `<html>` and remembers it. `light` and `dark` set `data-mode`, which the
 * tokens follow, and `system` removes it, so the page follows the device's setting. The choice is
 * kept in `localStorage` under `storageKey`. Where storage is blocked, as in some private windows,
 * the mode still changes, for this page only.
 */
function setMode(mode: Mode, storageKey: string = MODE_STORAGE_KEY): void {
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-mode");
  else root.setAttribute("data-mode", mode);
  try {
    if (mode === "system") localStorage.removeItem(storageKey);
    else localStorage.setItem(storageKey, mode);
  } catch {
    // Storage is unavailable: the mode lasts for this page only.
  }
}

/**
 * Calls `onChange` when the mode could have changed: `data-mode` or the class on `<html>` changed,
 * the device's setting changed, or another tab chose a mode, which this page then applies too.
 */
function subscribe(onChange: () => void, storageKey: string): () => void {
  const root = document.documentElement;
  const observer = new MutationObserver(onChange);
  observer.observe(root, { attributes: true, attributeFilter: ["data-mode", "class"] });
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  const fromAnotherTab = (event: StorageEvent) => {
    if (event.key !== storageKey) return;
    const value = event.newValue;
    if (isSetMode(value)) root.setAttribute("data-mode", value);
    else root.removeAttribute("data-mode");
  };
  window.addEventListener("storage", fromAnotherTab);
  return () => {
    observer.disconnect();
    query.removeEventListener("change", onChange);
    window.removeEventListener("storage", fromAnotherTab);
  };
}

/** What `useMode` returns. */
interface UseModeResult {
  /** The chosen mode, `system` when none is set. */
  mode: Mode;
  /** The mode the page is shown in. */
  resolvedMode: ResolvedMode;
  /** Chooses a mode, sets it on `<html>` and remembers it. */
  setMode: (mode: Mode) => void;
}

/**
 * The page's colour mode, kept on `<html>` as `data-mode`. Every component that uses it shows the
 * same mode, and follows a change made anywhere: by `setMode`, by another tab or by the device. The
 * server renders `system` and `light`, and the page takes the real mode once it is running.
 */
function useMode(storageKey: string = MODE_STORAGE_KEY): UseModeResult {
  const subscribeToMode = useCallback(
    (onChange: () => void) => subscribe(onChange, storageKey),
    [storageKey],
  );
  const mode = useSyncExternalStore(subscribeToMode, getMode, () => "system" as const);
  const resolvedMode = useSyncExternalStore(
    subscribeToMode,
    getResolvedMode,
    () => "light" as const,
  );
  const choose = useCallback(
    (next: Mode) => {
      setMode(next, storageKey);
    },
    [storageKey],
  );
  return { mode, resolvedMode, setMode: choose };
}

/** The words ModeToggle shows. Each has an en-AU default. */
interface ModeToggleLabels {
  /** The button's accessible name, and the heading of the menu. */
  trigger: string;
  light: string;
  dark: string;
  system: string;
}

const LABELS: ModeToggleLabels = {
  trigger: "Colour mode",
  light: "Light",
  dark: "Dark",
  system: "System",
};

const ICONS = { light: Sun, dark: Moon, system: Monitor } as const;

/** The trigger Button's props, plus the mode, its change and the words. */
type ModeToggleProps = Omit<ButtonProps, "children" | "iconOnly" | "render" | "value"> & {
  /**
   * The chosen mode, to control the toggle yourself. Left out, the toggle reads and sets the
   * page's mode on `<html>` with `useMode`.
   */
  value?: Mode;
  /** Called with the mode chosen from the menu. */
  onValueChange?: (mode: Mode) => void;
  /** Where the chosen mode is remembered. Used only when the toggle is not controlled. */
  storageKey?: string;
  /** The words, for another language. */
  labels?: Partial<ModeToggleLabels>;
  /** Where the menu lines up against the button. */
  align?: "start" | "center" | "end";
};

/**
 * shadcn's mode toggle: an icon button that opens a menu of Light, Dark and System. The icon is a
 * sun in light mode and a moon in dark mode, and the menu ticks the mode chosen. Choosing one sets
 * `data-mode` on `<html>` and remembers it in `localStorage`, and System removes both, so the page
 * follows the device's setting.
 *
 * To avoid a flash of the other mode when the page loads, run `MODE_SCRIPT` in the page's
 * `<head>`.
 */
function ModeToggle({
  value,
  onValueChange,
  storageKey = MODE_STORAGE_KEY,
  labels: labelsProp,
  align = "end",
  variant = "outline",
  ...props
}: ModeToggleProps) {
  const page = useMode(storageKey);
  const labels = { ...LABELS, ...labelsProp };
  const isControlled = value !== undefined;
  const mode = isControlled ? value : page.mode;
  // A controlled toggle shows the mode it is given. Under System it shows the page's.
  const shown = mode === "system" ? page.resolvedMode : mode;
  const Icon = shown === "dark" ? Moon : Sun;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-slot="mode-toggle"
        data-mode={mode}
        render={<Button variant={variant} iconOnly {...props} />}
      >
        <Icon aria-hidden />
        {labels.trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>{labels.trigger}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={mode}
            onValueChange={(next: unknown) => {
              const chosen: Mode = isSetMode(next) ? next : "system";
              if (!isControlled) page.setMode(chosen);
              onValueChange?.(chosen);
            }}
          >
            {(["light", "dark", "system"] as const).map((option) => {
              const OptionIcon = ICONS[option];
              return (
                // A radio item leaves its menu open by default. Choosing a mode is the whole
                // task, so the menu closes, as shadcn's plain items do.
                <DropdownMenuRadioItem key={option} value={option} closeOnClick>
                  <OptionIcon aria-hidden />
                  {labels[option]}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { getMode, getResolvedMode, MODE_SCRIPT, MODE_STORAGE_KEY, ModeToggle, setMode, useMode };
export type { Mode, ModeToggleLabels, ModeToggleProps, ResolvedMode, UseModeResult };
