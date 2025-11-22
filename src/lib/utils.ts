import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using `clsx` and merges Tailwind classes to avoid duplicates.
 *
 * Usage:
 * cn("px-2", condition && "bg-red-500", "px-4") → "bg-red-500 px-4"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}
