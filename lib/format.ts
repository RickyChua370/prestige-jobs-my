import type { Status } from "./types";

/** Format an ISO date (YYYY-MM-DD) as e.g. "15 Sep 2026". Returns fallback if null. */
export function formatDate(iso: string | null, fallback = "—"): string {
  if (!iso) return fallback;
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Days remaining until a close date; negative if past. Null if no date. */
export function daysUntil(iso: string | null, now: Date = new Date()): number | null {
  if (!iso) return null;
  const target = new Date(iso + "T23:59:59").getTime();
  return Math.ceil((target - now.getTime()) / (1000 * 60 * 60 * 24));
}

export const STATUS_META: Record<
  Status,
  { label: string; className: string }
> = {
  open: {
    label: "Open now",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  },
  upcoming: {
    label: "Upcoming",
    className: "bg-amber-100 text-amber-800 ring-amber-600/20",
  },
  closed: {
    label: "Closed",
    className: "bg-slate-100 text-slate-600 ring-slate-500/20",
  },
};
