import { INDUSTRIES, ROLE_TYPES, type ProgramInput } from "./types";

/** Validate & coerce arbitrary JSON into a ProgramInput. Returns errors list. */
export function parseProgramInput(body: unknown): {
  data?: ProgramInput;
  errors: string[];
} {
  const errors: string[] = [];
  const b = (body ?? {}) as Record<string, unknown>;

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const optStr = (v: unknown) =>
    typeof v === "string" && v.trim() !== "" ? v.trim() : null;

  const title = str(b.title);
  const company = str(b.company);
  const industry = str(b.industry);
  const roleType = str(b.roleType);
  const location = str(b.location) || "Malaysia";
  const applyLink = str(b.applyLink);

  if (!title) errors.push("Job title is required.");
  if (!company) errors.push("Company is required.");
  if (!INDUSTRIES.includes(industry as never))
    errors.push(`Industry must be one of: ${INDUSTRIES.join(", ")}.`);
  if (!ROLE_TYPES.includes(roleType as never))
    errors.push(`Role type must be one of: ${ROLE_TYPES.join(", ")}.`);
  if (!applyLink) errors.push("Apply link is required.");
  else if (!/^https?:\/\//i.test(applyLink))
    errors.push("Apply link must start with http:// or https://.");

  const isoOrNull = (v: unknown, label: string): string | null => {
    const s = optStr(v);
    if (s === null) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      errors.push(`${label} must be a valid date (YYYY-MM-DD).`);
      return null;
    }
    return s;
  };

  const openDate = isoOrNull(b.openDate, "Open date");
  const closeDate = isoOrNull(b.closeDate, "Close date");
  if (openDate && closeDate && closeDate < openDate)
    errors.push("Close date cannot be before open date.");

  if (errors.length) return { errors };

  return {
    errors: [],
    data: {
      title,
      company,
      industry: industry as ProgramInput["industry"],
      roleType: roleType as ProgramInput["roleType"],
      location,
      openDate,
      closeDate,
      expectedReopen: optStr(b.expectedReopen),
      applyLink,
      eligibility: optStr(b.eligibility),
      notes: optStr(b.notes),
    },
  };
}
