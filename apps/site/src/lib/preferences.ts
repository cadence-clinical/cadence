import { BRANDS } from "@cadence-clinical/tokens";

/** A choice the site remembers and states as a data attribute on <html>. */
export interface Preference {
  attribute: string;
  /** Where the choice is remembered. */
  storageKey: string;
  /** The values it may take. Anything else, or none, leaves the attribute off. */
  values: readonly string[];
}

/** An example brand's colours and fonts. With none, the page is Cadence's own. */
export const BRAND: Preference = {
  attribute: "data-brand",
  storageKey: "cadence-brand",
  values: Object.keys(BRANDS),
};

/** The density. With none, it follows the device: compact, or the touch default on a touch screen. */
export const DENSITY: Preference = {
  attribute: "data-density",
  storageKey: "cadence-density",
  values: ["compact", "comfortable"],
};

/** Whether a value is one a preference may take. */
export const allows = (preference: Preference, value: string): boolean =>
  preference.values.includes(value);

/**
 * Applies each remembered choice before the page is painted, so a reload does not flash the
 * defaults first. It sets only values it knows, and does nothing when storage is unavailable.
 */
export const PREFERENCE_SCRIPT = [BRAND, DENSITY]
  .map(
    ({ attribute, storageKey, values }) =>
      `try{var v=localStorage.getItem(${JSON.stringify(storageKey)});if(v&&${JSON.stringify(values)}.indexOf(v)>-1)document.documentElement.setAttribute(${JSON.stringify(attribute)},v)}catch(e){}`,
  )
  .join("");
