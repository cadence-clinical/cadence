import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge only resolves conflicts between classes it recognises. Without the Cadence
// density scale registered here, a consumer's `h-10` would not override `h-control`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: [
        "control-sm",
        "control",
        "control-lg",
        "control-x",
        "control-gap",
        "control-indicator",
        "container",
        "container-sm",
      ],
      text: ["control", "body", "title"],
    },
  },
});

/** Joins class names and resolves Tailwind conflicts, so a consumer's className wins. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
