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
 * Lifecycle status of an application window.
 * - open:     accepting applications right now
 * - upcoming: an annual programme expected to reopen (dates estimated)
 * - closed:   window has passed for this cycle
 */
export const STATUSES = ["open", "upcoming", "closed"] as const;
export type Status = (typeof STATUSES)[number];

export interface Program {
  id: number;
  title: string;
  company: string;
  industry: Industry;
  roleType: RoleType;
  location: string;
  /** ISO date (YYYY-MM-DD) when applications open, or null if rolling/unknown. */
  openDate: string | null;
  /** ISO date (YYYY-MM-DD) when applications close, or null if rolling/unknown. */
  closeDate: string | null;
  /**
   * For annual/recurring programmes not yet open: a human-friendly estimate of
   * when the next cycle is expected (e.g. "Expected Aug 2026").
   */
  expectedReopen: string | null;
  /** Direct link to the official careers / application page. */
  applyLink: string;
  /** Eligibility summary, e.g. "Penultimate-year students" or "Fresh grads <2yrs". */
  eligibility: string | null;
  /** Free-form curator notes (perks, cohort size, deadlines nuance). */
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Shape used when creating/updating (no server-managed fields). */
export type ProgramInput = Omit<Program, "id" | "createdAt" | "updatedAt">;

/**
 * Derive the *effective* status of a program from its dates and the current
 * time. Stored status is a hint; dates are the source of truth when present.
 */
export function computeStatus(
  program: Pick<Program, "openDate" | "closeDate" | "expectedReopen">,
  now: Date = new Date()
): Status {
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
