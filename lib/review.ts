// ---------------------------------------------------------------------------
// Review / staleness logic.
//
// These pure functions look at a programme's dates and freshness and decide
// whether a curator should review it. They power the "Needs review" tools in
// the admin dashboard — the semi-automated maintenance helpers that make
// keeping this curated board accurate almost effortless.
// ---------------------------------------------------------------------------

import type { Program } from "./types";

export type ReviewReasonCode =
  | "closed_recently" // close date has passed — likely needs next cycle's dates
  | "reopen_due" // an "upcoming" annual cycle whose expected month has arrived
  | "closing_soon" // open and closing within a few days — worth a final check
  | "stale"; // not touched in a long time — verify it's still accurate

export interface ReviewReason {
  code: ReviewReasonCode;
  /** Human-friendly explanation shown to the curator. */
  message: string;
  /** Higher = more urgent; used for sorting/among-badges priority. */
  severity: number;
}

/** How long (days) without an update before a programme is considered stale. */
export const STALE_AFTER_DAYS = 120;

/** "Closing soon" threshold in days. */
const CLOSING_SOON_DAYS = 7;

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Parse "Expected Aug 2026" style text into the first day of that month. */
export function parseExpectedReopen(text: string | null): string | null {
  if (!text) return null;
  // Match a month name (full or 3-letter) followed by a 4-digit year.
  const m = text.match(
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/i
  );
  if (!m) return null;
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const monthIdx = months[m[1].slice(0, 3).toLowerCase()];
  const year = Number(m[2]);
  if (monthIdx === undefined || Number.isNaN(year)) return null;
  return iso(new Date(Date.UTC(year, monthIdx, 1)));
}

/**
 * Determine all review reasons for a single programme.
 * Returns an empty array if nothing needs attention.
 */
export function getReviewReasons(
  p: Program,
  now: Date = new Date()
): ReviewReason[] {
  const reasons: ReviewReason[] = [];
  const today = iso(now);

  // 1. Close date has passed → the listing is out of date for this cycle.
  if (p.closeDate && p.closeDate < today) {
    const days = daysBetween(p.closeDate, today);
    reasons.push({
      code: "closed_recently",
      message:
        days <= 1
          ? "Closed today — update with next cycle's dates or mark upcoming."
          : `Closed ${days} days ago — update the dates for the next cycle.`,
      severity: 3,
    });
  }

  // 2. An "upcoming" annual cycle whose expected reopen month has arrived.
  if (!p.openDate && !p.closeDate && p.expectedReopen) {
    const due = parseExpectedReopen(p.expectedReopen);
    if (due && due <= today) {
      reasons.push({
        code: "reopen_due",
        message: `Expected to reopen (${p.expectedReopen}) has arrived — check the official page and add real dates.`,
        severity: 3,
      });
    }
  }

  // 3. Open and closing very soon — a nudge to verify before it lapses.
  if (p.openDate && p.closeDate && p.openDate <= today && p.closeDate >= today) {
    const days = daysBetween(today, p.closeDate);
    if (days <= CLOSING_SOON_DAYS) {
      reasons.push({
        code: "closing_soon",
        message:
          days === 0
            ? "Closes today."
            : `Closes in ${days} day${days === 1 ? "" : "s"}.`,
        severity: 1,
      });
    }
  }

  // 4. Stale — not updated in a long time.
  if (p.updatedAt) {
    const updatedDay = p.updatedAt.slice(0, 10);
    const age = daysBetween(updatedDay, today);
    if (age >= STALE_AFTER_DAYS) {
      reasons.push({
        code: "stale",
        message: `Not updated in ${age} days — verify it's still accurate.`,
        severity: 2,
      });
    }
  }

  return reasons.sort((a, b) => b.severity - a.severity);
}

export function needsReview(p: Program, now: Date = new Date()): boolean {
  return getReviewReasons(p, now).length > 0;
}

/** Summary counts for the dashboard banner. */
export interface ReviewSummary {
  total: number;
  needsReview: number;
  byCode: Record<ReviewReasonCode, number>;
}

export function summarizeReview(
  programs: Program[],
  now: Date = new Date()
): ReviewSummary {
  const byCode: Record<ReviewReasonCode, number> = {
    closed_recently: 0,
    reopen_due: 0,
    closing_soon: 0,
    stale: 0,
  };
  let needs = 0;
  for (const p of programs) {
    const reasons = getReviewReasons(p, now);
    if (reasons.length) needs++;
    for (const r of reasons) byCode[r.code]++;
  }
  return { total: programs.length, needsReview: needs, byCode };
}

/** Whole days from date a (ISO) to date b (ISO); assumes a <= b for positive. */
function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso + "T00:00:00Z").getTime();
  const b = new Date(bIso + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86_400_000);
}
