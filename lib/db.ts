import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import type { Program, ProgramInput } from "./types";

// ---------------------------------------------------------------------------
// SQLite connection (single shared instance across the server process).
// The database file lives in /data and is created on first use.
// ---------------------------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "prestige-jobs.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS programs (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      title          TEXT NOT NULL,
      company        TEXT NOT NULL,
      industry       TEXT NOT NULL,
      roleType       TEXT NOT NULL,
      location       TEXT NOT NULL,
      openDate       TEXT,
      closeDate      TEXT,
      expectedReopen TEXT,
      applyLink      TEXT NOT NULL,
      eligibility    TEXT,
      notes          TEXT,
      createdAt      TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt      TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_programs_industry ON programs(industry);
    CREATE INDEX IF NOT EXISTS idx_programs_company  ON programs(company);
  `);

  _db = db;
  return db;
}

// ---------------------------------------------------------------------------
// Data-access helpers
// ---------------------------------------------------------------------------

export function listPrograms(): Program[] {
  return getDb()
    .prepare(`SELECT * FROM programs ORDER BY company COLLATE NOCASE, title`)
    .all() as Program[];
}

export function getProgram(id: number): Program | undefined {
  return getDb().prepare(`SELECT * FROM programs WHERE id = ?`).get(id) as
    | Program
    | undefined;
}

export function createProgram(input: ProgramInput): Program {
  const stmt = getDb().prepare(`
    INSERT INTO programs
      (title, company, industry, roleType, location, openDate, closeDate,
       expectedReopen, applyLink, eligibility, notes)
    VALUES
      (@title, @company, @industry, @roleType, @location, @openDate, @closeDate,
       @expectedReopen, @applyLink, @eligibility, @notes)
  `);
  const info = stmt.run(normalize(input));
  return getProgram(Number(info.lastInsertRowid))!;
}

export function updateProgram(id: number, input: ProgramInput): Program | undefined {
  const stmt = getDb().prepare(`
    UPDATE programs SET
      title=@title, company=@company, industry=@industry, roleType=@roleType,
      location=@location, openDate=@openDate, closeDate=@closeDate,
      expectedReopen=@expectedReopen, applyLink=@applyLink,
      eligibility=@eligibility, notes=@notes, updatedAt=datetime('now')
    WHERE id=@id
  `);
  stmt.run({ ...normalize(input), id });
  return getProgram(id);
}

export function deleteProgram(id: number): boolean {
  const info = getDb().prepare(`DELETE FROM programs WHERE id = ?`).run(id);
  return info.changes > 0;
}

export function countPrograms(): number {
  const row = getDb().prepare(`SELECT COUNT(*) AS n FROM programs`).get() as {
    n: number;
  };
  return row.n;
}

/** Coerce empty strings to null so optional date/text columns stay clean. */
function normalize(input: ProgramInput) {
  const nn = (v: string | null | undefined) =>
    v === undefined || v === "" ? null : v;
  return {
    title: input.title.trim(),
    company: input.company.trim(),
    industry: input.industry,
    roleType: input.roleType,
    location: input.location.trim(),
    openDate: nn(input.openDate),
    closeDate: nn(input.closeDate),
    expectedReopen: nn(input.expectedReopen),
    applyLink: input.applyLink.trim(),
    eligibility: nn(input.eligibility),
    notes: nn(input.notes),
  };
}
