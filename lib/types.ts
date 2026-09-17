// ---------------------------------------------------------------------------
// Core domain types for the Prestige Jobs MY platform.
//
// A "Program" represents a single prestigious opportunity: either a summer
// internship or a fresh-graduate role (management trainee / associate scheme,
// graduate programme, etc.) at a well-known employer operating in Malaysia.
// ---------------------------------------------------------------------------

/** High-paying / prestige industries we curate. */
export const INDUSTRIES = [
  "Investment Banking",
  "Consulting",
  "Professional Services", // Big 4 audit/tax/advisory
  "FMCG",
  "Big Tech",
  "Oil & Gas",
  "Management Trainee",
  "Insurance & Asset Management",
  "Telecommunications",
  "Aviation",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

/** Type of role. */
export const ROLE_TYPES = [
  "Internship",
  "Graduate Programme",
  "Management Trainee",
  "Management Associate",
] as const;

export type RoleType = (typeof ROLE_TYPES)[number];

/**
 * Lifecycle status of an application window (used for filtering & grouping).
 * - open:     accepting applications right now
 * - upcoming: an annual programme expected to reopen (dates estimated)
 * - closed:   window has passed for this cycle
 */
export const STATUSES = ["open", "upcoming", "closed"] as const;
export type Status = (typeof STATUSES)[number];

/**
 * How a programme's timing is described. Lets the curator be honest when exact
 * dates aren't known, instead of inventing precise dates.
 *
 * - dates:          use openDate/closeDate; status is computed & can change as
 *                   time passes (the original behaviour; default for all
 *                   existing programmes).
 * - open_now:       accepting applications now; no specific close date known.
 * - open_all_year:  rolling — always accepting, no cycle.
 * - closing_soon:   open but wrapping up; no exact close date.
 * - upcoming:       not open yet (optionally with an "expected" note).
 * - closed:         not currently accepting.
 *
 * All modes EXCEPT `dates` are manual: the board shows exactly what the curator
 * chose and never auto-changes it.
 */
export const TIMING_MODES = [
  "dates",
  "open_now",
  "open_all_year",
  "closing_soon",
  "upcoming",
  "closed",
] as const;
export type TimingMode = (typeof TIMING_MODES)[number];

/** Which timing modes are "manual" (never auto-change from time passing). */
export const MANUAL_TIMING_MODES: readonly TimingMode[] = [
  "open_now",
  "open_all_year",
  "closing_soon",
  "upcoming",
  "closed",
];

/** Map each timing mode to the filter-level Status it belongs to. */
export function statusForMode(mode: TimingMode): Status {
  switch (mode) {
    case "open_now":
    case "open_all_year":
    case "closing_soon":
      return "open";
    case "upcoming":
      return "upcoming";
    case "closed":
      return "closed";
    default:
      return "open"; // 'dates' is resolved separately via computeStatus
  }
}

export interface Program {
  id: number;
  title: string;
  company: string;
  industry: Industry;
  roleType: RoleType;
  location: string;
  /**
   * How this programme's timing is described. Defaults to "dates" for
   * backward compatibility (status computed from openDate/closeDate).
   */
  timingMode: TimingMode;
  /** ISO date (YYYY-MM-DD) when applications open, or null if rolling/unknown. */
  openDate: string | null;
  /** ISO date (YYYY-MM-DD) when applications close, or null if rolling/unknown. */
  closeDate: string | null;
  /**
   * For annual/recurring programmes not yet open: a human-friendly estimate of
   * when the next cycle is expected (e.g. "Expected Aug 2026").
   */
  expectedReopen: string | null;
  /** Direct link to the official application page (used when the role is open). */
  applyLink: string;
  /**
   * Link to the programme's info/details page (used when the role is upcoming
   * or closed, so students can read about it and bookmark for next cycle).
   * Null falls back to applyLink.
   */
  infoLink: string | null;
  /** Eligibility summary, e.g. "Penultimate-year students" or "Fresh grads <2yrs". */
  eligibility: string | null;
  /** Free-form curator notes (perks, cohort size, deadlines nuance). */
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Shape used when creating/updating (no server-managed fields). */
export type ProgramInput = Omit<Program, "id" | "createdAt" | "updatedAt">;

type StatusInput = Pick<
  Program,
  "timingMode" | "openDate" | "closeDate" | "expectedReopen"
>;

/**
 * Derive the filter-level status (open / upcoming / closed).
 *
 * If timingMode is a manual label, that wins and never changes with time.
 * If timingMode is "dates" (default), compute from openDate/closeDate exactly
 * as before — so all existing programmes behave identically.
 */
export function computeStatus(
  program: StatusInput,
  now: Date = new Date()
): Status {
  const mode = program.timingMode ?? "dates";
  if (mode !== "dates") return statusForMode(mode);

  const today = now.toISOString().slice(0, 10);
  const { openDate, closeDate } = program;

  if (closeDate && closeDate < today) return "closed";
  if (openDate && openDate > today) return "upcoming";
  if (openDate && closeDate) {
    if (today >= openDate && today <= closeDate) return "open";
  }
  // No firm dates but flagged as an upcoming annual cycle.
  if (!openDate && !closeDate && program.expectedReopen) return "upcoming";
  // Open date reached, no close date (rolling) -> treat as open.
  if (openDate && !closeDate && today >= openDate) return "open";
  return "upcoming";
}

/**
 * A richer badge for display. Distinguishes the manual "flavours" of open
 * (open now / all year / closing soon) so the board can show an honest label,
 * while still collapsing to a filter Status via computeStatus().
 */
export type DisplayStatus =
  | "open"
  | "open_all_year"
  | "closing_soon"
  | "upcoming"
  | "closed";

export function displayStatus(
  program: StatusInput,
  now: Date = new Date()
): DisplayStatus {
  const mode = program.timingMode ?? "dates";
  if (mode === "open_all_year") return "open_all_year";
  if (mode === "closing_soon") return "closing_soon";
  if (mode === "open_now") return "open";
  if (mode === "upcoming") return "upcoming";
  if (mode === "closed") return "closed";
  // mode === "dates": derive from the computed status.
  return computeStatus(program, now);
}

/**
 * Choose which link to show and how to label it, based on the programme's
 * effective status:
 *  - open      → "Apply" using applyLink (fall back to infoLink)
 *  - upcoming/ → "View details" using infoLink (fall back to applyLink)
 *    closed
 */
export function pickLink(
  program: Pick<
    Program,
    | "timingMode"
    | "openDate"
    | "closeDate"
    | "expectedReopen"
    | "applyLink"
    | "infoLink"
  >,
  now: Date = new Date()
): { href: string; label: string; isApply: boolean } {
  const status = computeStatus(program, now);
  if (status === "open") {
    return {
      href: program.applyLink || program.infoLink || "#",
      label: "Apply",
      isApply: true,
    };
  }
  return {
    href: program.infoLink || program.applyLink || "#",
    label: "View details",
    isApply: false,
  };
}
