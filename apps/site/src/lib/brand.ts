import { BRANDS } from "@cadence-clinical/tokens";

/** Where the site remembers the chosen brand. */
export const BRAND_STORAGE_KEY = "cadence-brand";

/** Cadence's own look, with no brand applied. */
export const NO_BRAND = "cadence";

/** Whether a value names one of the example brands. */
export const isBrand = (value: string): value is keyof typeof BRANDS =>
  Object.hasOwn(BRANDS, value);

/**
 * Applies the remembered brand before the page is painted, so a reload does not flash Cadence's
 * colours first. It sets only a brand it knows, and does nothing when storage is unavailable.
 */
export const BRAND_SCRIPT = `try{var b=localStorage.getItem(${JSON.stringify(BRAND_STORAGE_KEY)});if(b&&${JSON.stringify(Object.keys(BRANDS))}.indexOf(b)>-1)document.documentElement.setAttribute("data-brand",b)}catch(e){}`;
