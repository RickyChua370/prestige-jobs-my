// ---------------------------------------------------------------------------
// CSV import / export for bulk maintenance.
//
// Export: turn programmes into a spreadsheet the curator can edit in Excel /
//         Google Sheets.
// Import: parse that spreadsheet back, validating each row, so many programmes
//         can be updated (or added) at once.
// ---------------------------------------------------------------------------

import type { Program, ProgramInput } from "./types";
import { parseProgramInput } from "./validate";

/** Column order for export/import. `id` is optional on import (blank = create). */
export const CSV_COLUMNS = [
  "id",
  "title",
  "company",
  "industry",
  "roleType",
  "location",
  "openDate",
  "closeDate",
  "expectedReopen",
  "applyLink",
  "infoLink",
  "eligibility",
  "notes",
] as const;

/** Escape a single CSV field (RFC 4180: wrap in quotes, double internal quotes). */
function esc(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Serialize programmes to a CSV string. */
export function programsToCsv(programs: Program[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = programs.map((p) => {
    const rec = p as unknown as Record<string, unknown>;
    return CSV_COLUMNS.map((c) => esc(rec[c])).join(",");
  });
  return [header, ...rows].join("\r\n");
}

/**
 * Parse a CSV string into rows of string fields. Handles quoted fields,
 * escaped quotes, and embedded commas/newlines. Returns array of string[].
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  // Normalize newlines and strip a UTF-8 BOM if present.
  const src = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      // handle \r\n as a single break
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  // flush trailing field/row (if file doesn't end with newline)
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // drop fully-empty trailing rows
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export interface CsvImportRow {
  /** Present when the row targets an existing programme (update). */
  id: number | null;
  data: ProgramInput;
}

export interface CsvImportResult {
  rows: CsvImportRow[];
  errors: string[];
}

/**
 * Parse + validate an uploaded CSV into typed import rows.
 * The header row must contain the known column names (order-independent).
 */
export function parseImportCsv(text: string): CsvImportResult {
  const errors: string[] = [];
  const grid = parseCsv(text);
  if (grid.length === 0) {
    return { rows: [], errors: ["The file is empty."] };
  }

  const header = grid[0].map((h) => h.trim());
  const idx: Record<string, number> = {};
  header.forEach((h, i) => (idx[h] = i));

  // Required columns for a valid import file.
  const required = ["title", "company", "industry", "roleType", "applyLink"];
  const missing = required.filter((c) => !(c in idx));
  if (missing.length) {
    return {
      rows: [],
      errors: [
        `The file is missing required column(s): ${missing.join(", ")}. ` +
          `Tip: export first to get a correctly-formatted template.`,
      ],
    };
  }

  const get = (r: string[], col: string) =>
    idx[col] !== undefined ? (r[idx[col]] ?? "").trim() : "";

  const rows: CsvImportRow[] = [];
  for (let i = 1; i < grid.length; i++) {
    const line = grid[i];
    const rawId = get(line, "id");
    const candidate = {
      title: get(line, "title"),
      company: get(line, "company"),
      industry: get(line, "industry"),
      roleType: get(line, "roleType"),
      location: get(line, "location"),
      openDate: get(line, "openDate"),
      closeDate: get(line, "closeDate"),
      expectedReopen: get(line, "expectedReopen"),
      applyLink: get(line, "applyLink"),
      infoLink: get(line, "infoLink"),
      eligibility: get(line, "eligibility"),
      notes: get(line, "notes"),
    };
    const { data, errors: rowErrors } = parseProgramInput(candidate);
    if (!data) {
      errors.push(`Row ${i + 1}: ${rowErrors.join(" ")}`);
      continue;
    }
    let id: number | null = null;
    if (rawId !== "") {
      const n = Number(rawId);
      if (!Number.isInteger(n) || n <= 0) {
        errors.push(`Row ${i + 1}: id "${rawId}" is not a valid number.`);
        continue;
      }
      id = n;
    }
    rows.push({ id, data });
  }

  return { rows, errors };
}
