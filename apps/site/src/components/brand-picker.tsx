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
import { Palette } from "lucide-react";
import { useSyncExternalStore } from "react";

import { BRAND_STORAGE_KEY, NO_BRAND, isBrand } from "@/lib/brand";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** The brand on <html>, which the script in the page's head set before React ran. */
function current(): string {
  const value = document.documentElement.getAttribute("data-brand");
  return value !== null && isBrand(value) ? value : NO_BRAND;
}

function choose(value: unknown) {
  if (typeof value !== "string") return;
  const root = document.documentElement;
  if (isBrand(value)) root.setAttribute("data-brand", value);
  else root.removeAttribute("data-brand");
  try {
    if (isBrand(value)) localStorage.setItem(BRAND_STORAGE_KEY, value);
    else localStorage.removeItem(BRAND_STORAGE_KEY);
  } catch {
    // Storage is unavailable, as in a private window: the choice lasts for this page only.
  }
  for (const listener of listeners) listener();
}

/**
 * Chooses the brand the docs are shown in: its colours and its fonts. The server renders Cadence's
 * name, and the picker takes the real choice once it is running.
 */
function BrandPicker() {
  const brand = useSyncExternalStore(subscribe, current, () => NO_BRAND);
  const label = isBrand(brand) ? BRANDS[brand].label : "Cadence";
  return (
    <DropdownMenu>
      {/* Drawn like Fumadocs' light and dark switch beside it: the same border, no fill, and the
          icon marked as the switch marks the mode in use, here while the menu is open. */}
      <DropdownMenuTrigger className="group inline-flex items-center rounded-full border p-1">
        <Palette
          aria-hidden
          className="text-fd-muted-foreground group-data-popup-open:bg-fd-accent group-data-popup-open:text-fd-accent-foreground size-6.5 rounded-full p-1.5"
        />
        <span className="sr-only">{`Theme: ${label}`}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={brand} onValueChange={choose}>
            <DropdownMenuRadioItem value={NO_BRAND}>Cadence</DropdownMenuRadioItem>
            {Object.entries(BRANDS).map(([name, entry]) => (
              <DropdownMenuRadioItem key={name} value={name}>
                {entry.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Fumadocs' light and dark switch, with the theme picker beside it. */
export function ThemeControls({ className, ...props }: ThemeSwitchProps) {
  return (
    <div className={["flex items-center gap-1.5", className].filter(Boolean).join(" ")}>
      <BrandPicker />
      <ThemeSwitch {...props} />
    </div>
  );
}
