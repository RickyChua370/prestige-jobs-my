import type { DisplayStatus, Status } from "./types";

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

/** Relative "time ago" from an ISO timestamp, e.g. "3 days ago", "just now". */
export function timeAgo(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "unknown";
  const secs = Math.max(0, Math.floor((now.getTime() - then) / 1000));
  const mins = Math.floor(secs / 60);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  const months = Math.floor(days / 30);
  if (secs < 60) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
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

/** Richer badge metadata for the display status (distinguishes open flavours). */
export const DISPLAY_STATUS_META: Record<
  DisplayStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Open now",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  },
  open_all_year: {
    label: "Open · all year",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  },
  closing_soon: {
    label: "Closing soon",
    className: "bg-orange-100 text-orange-800 ring-orange-600/20",
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
