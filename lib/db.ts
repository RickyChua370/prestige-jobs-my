import { Pool } from "pg";
import type { Program, ProgramInput } from "./types";

// ---------------------------------------------------------------------------
// Postgres connection via node-postgres (pg).
//
// A single shared Pool is reused across invocations. The connection string
// comes from the DATABASE_URL environment variable:
//   - Locally:  put it in .env.local
//   - On Vercel: set it in Project Settings → Environment Variables
//                (the Neon integration adds it automatically)
//
// Using a standard TCP driver + pool works with ANY Postgres — Neon, a local
// database, or any managed host — and is Neon's recommended method on Vercel.
// For serverless, use Neon's *pooled* connection string (host contains
// "-pooler") so connections are multiplexed through PgBouncer.
// ---------------------------------------------------------------------------

// Reuse the pool across hot reloads / serverless invocations in the same
// process by stashing it on globalThis.
const globalForPg = globalThis as unknown as { _pgPool?: Pool };

function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add your Postgres connection string to .env.local (local) or Vercel env vars (production)."
    );
  }
  if (!globalForPg._pgPool) {
    globalForPg._pgPool = new Pool({
      connectionString: url,
      // Neon and most managed Postgres require SSL. `rejectUnauthorized: false`
      // avoids local CA hassles; the connection is still encrypted.
      ssl: url.includes("sslmode=require") || url.includes("neon.tech")
        ? { rejectUnauthorized: false }
        : undefined,
      max: 5,
    });
  }
  return globalForPg._pgPool;
}

async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await getPool().query(text, params);
  return res.rows as T[];
}

/**
 * Create the table if it doesn't exist. Safe to call repeatedly.
 * Called by data-access helpers and the seed script.
 */
export async function ensureSchema(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS programs (
      id             SERIAL PRIMARY KEY,
      title          TEXT NOT NULL,
      company        TEXT NOT NULL,
      industry       TEXT NOT NULL,
      "roleType"     TEXT NOT NULL,
      location       TEXT NOT NULL,
      "openDate"     TEXT,
      "closeDate"    TEXT,
      "expectedReopen" TEXT,
      "applyLink"    TEXT NOT NULL,
      eligibility    TEXT,
      notes          TEXT,
      "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_programs_industry ON programs(industry);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_programs_company ON programs(company);`);
}

// ---------------------------------------------------------------------------
// Data-access helpers (all async)
// ---------------------------------------------------------------------------

export async function listPrograms(): Promise<Program[]> {
  await ensureSchema();
  return query<Program>(
    `SELECT * FROM programs ORDER BY lower(company), title`
  );
}

export async function getProgram(id: number): Promise<Program | undefined> {
  const rows = await query<Program>(`SELECT * FROM programs WHERE id = $1`, [id]);
  return rows[0];
}

export async function createProgram(input: ProgramInput): Promise<Program> {
  await ensureSchema();
  const p = normalize(input);
  const rows = await query<Program>(
    `INSERT INTO programs
      (title, company, industry, "roleType", location, "openDate", "closeDate",
       "expectedReopen", "applyLink", eligibility, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      p.title, p.company, p.industry, p.roleType, p.location, p.openDate,
      p.closeDate, p.expectedReopen, p.applyLink, p.eligibility, p.notes,
    ]
  );
  return rows[0];
}

export async function updateProgram(
  id: number,
  input: ProgramInput
): Promise<Program | undefined> {
  const p = normalize(input);
  const rows = await query<Program>(
    `UPDATE programs SET
       title=$1, company=$2, industry=$3, "roleType"=$4, location=$5,
       "openDate"=$6, "closeDate"=$7, "expectedReopen"=$8, "applyLink"=$9,
       eligibility=$10, notes=$11, "updatedAt"=now()
     WHERE id=$12
     RETURNING *`,
    [
      p.title, p.company, p.industry, p.roleType, p.location, p.openDate,
      p.closeDate, p.expectedReopen, p.applyLink, p.eligibility, p.notes, id,
    ]
  );
  return rows[0];
}

export async function deleteProgram(id: number): Promise<boolean> {
  const rows = await query(`DELETE FROM programs WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

export async function countPrograms(): Promise<number> {
  await ensureSchema();
  const rows = await query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM programs`);
  return rows[0].n;
}

export interface BulkImportOutcome {
  created: number;
  updated: number;
  skippedMissingIds: number[];
}

/**
 * Bulk import for the CSV uploader. Rows with an id update the matching
 * programme (skipped if that id no longer exists); rows without an id create
 * a new programme. Runs inside a single transaction so a mid-way failure
 * rolls everything back.
 */
export async function bulkImportPrograms(
  rows: { id: number | null; data: ProgramInput }[]
): Promise<BulkImportOutcome> {
  await ensureSchema();
  const pool = getPool();
  const client = await pool.connect();
  const outcome: BulkImportOutcome = {
    created: 0,
    updated: 0,
    skippedMissingIds: [],
  };
  try {
    await client.query("BEGIN");
    for (const { id, data } of rows) {
      const p = normalize(data);
      const values = [
        p.title, p.company, p.industry, p.roleType, p.location, p.openDate,
        p.closeDate, p.expectedReopen, p.applyLink, p.eligibility, p.notes,
      ];
      if (id !== null) {
        const res = await client.query(
          `UPDATE programs SET
             title=$1, company=$2, industry=$3, "roleType"=$4, location=$5,
             "openDate"=$6, "closeDate"=$7, "expectedReopen"=$8, "applyLink"=$9,
             eligibility=$10, notes=$11, "updatedAt"=now()
           WHERE id=$12`,
          [...values, id]
        );
        if (res.rowCount && res.rowCount > 0) outcome.updated++;
        else outcome.skippedMissingIds.push(id);
      } else {
        await client.query(
          `INSERT INTO programs
             (title, company, industry, "roleType", location, "openDate",
              "closeDate", "expectedReopen", "applyLink", eligibility, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          values
        );
        outcome.created++;
      }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return outcome;
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
