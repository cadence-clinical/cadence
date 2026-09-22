"use client";

import { BRANDS } from "@cadence-clinical/tokens";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@cadence-clinical/ui";
import { ThemeSwitch, type ThemeSwitchProps } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import { Palette, Rows3, type LucideIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

import { BRAND, DENSITY, allows, type Preference } from "@/lib/preferences";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** The value on <html>, which the script in the page's head set before React ran, or `none`. */
function current(preference: Preference, none: string): string {
  const value = document.documentElement.getAttribute(preference.attribute);
  return value !== null && allows(preference, value) ? value : none;
}

/** Sets the value on <html> and remembers it. Any value the preference does not take clears it. */
function choose(preference: Preference, value: unknown) {
  if (typeof value !== "string") return;
  const root = document.documentElement;
  const known = allows(preference, value);
  if (known) root.setAttribute(preference.attribute, value);
  else root.removeAttribute(preference.attribute);
  try {
    if (known) localStorage.setItem(preference.storageKey, value);
    else localStorage.removeItem(preference.storageKey);
  } catch {
    // Storage is unavailable, as in a private window: the choice lasts for this page only.
  }
  for (const listener of listeners) listener();
}

interface Option {
  value: string;
  label: string;
}

interface PreferencePickerProps {
  preference: Preference;
  /** The picker's name, and the label above its choices. */
  title: string;
  icon: LucideIcon;
  /** The choice that leaves the attribute off. */
  none: Option;
  options: Option[];
}

/**
 * A menu of choices for one preference. The server renders the `none` choice, and the picker takes
 * the real one once it is running.
 */
function PreferencePicker({ preference, title, icon: Icon, none, options }: PreferencePickerProps) {
  const value = useSyncExternalStore(
    subscribe,
    () => current(preference, none.value),
    () => none.value,
  );
  const label = options.find((option) => option.value === value)?.label ?? none.label;
  return (
    <DropdownMenu>
      {/* Drawn like Fumadocs' light and dark switch beside it: the same border, no fill, and the
          icon marked as the switch marks the mode in use, here while the menu is open. */}
      <DropdownMenuTrigger className="group inline-flex items-center rounded-full border p-1">
        <Icon
          aria-hidden
          className="text-fd-muted-foreground group-data-popup-open:bg-fd-accent group-data-popup-open:text-fd-accent-foreground size-6.5 rounded-full p-1.5"
        />
        <span className="sr-only">{`${title}: ${label}`}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{title}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(next) => {
              choose(preference, next);
            }}
          >
            {[none, ...options].map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const BRAND_OPTIONS = Object.entries(BRANDS).map(([value, brand]) => ({
  value,
  label: brand.label,
}));

const DENSITY_OPTIONS = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
];

/**
 * Fumadocs' light and dark switch, with the theme and density pickers beside it. The theme sets a
 * brand's colours and fonts. Automatic density follows the device: compact with a mouse, the touch
 * default on a touch screen.
 */
export function ThemeControls({ className, ...props }: ThemeSwitchProps) {
  return (
    <div className={["flex items-center gap-1.5", className].filter(Boolean).join(" ")}>
      <PreferencePicker
        preference={BRAND}
        title="Theme"
        icon={Palette}
        none={{ value: "cadence", label: "Cadence" }}
        options={BRAND_OPTIONS}
      />
      <PreferencePicker
        preference={DENSITY}
        title="Density"
        icon={Rows3}
        none={{ value: "automatic", label: "Automatic" }}
        options={DENSITY_OPTIONS}
      />
      <ThemeSwitch {...props} />
    </div>
  );
}
