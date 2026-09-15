import { NextResponse } from "next/server";
import { bulkImportPrograms } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { parseImportCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

// POST /api/programs/import — bulk create/update from CSV text (admin only).
// Body: { csv: string }
export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const csv = (body as { csv?: string } | null)?.csv;
  if (typeof csv !== "string" || csv.trim() === "") {
    return NextResponse.json(
      { errors: ["No CSV content received."] },
      { status: 400 }
    );
  }

  const { rows, errors } = parseImportCsv(csv);

  // If any row failed validation, reject the whole import so the file and the
  // database never drift out of sync. The curator fixes the file and retries.
  if (errors.length) {
    return NextResponse.json({ errors }, { status: 400 });
  }
  if (rows.length === 0) {
    return NextResponse.json(
      { errors: ["No data rows found in the file."] },
      { status: 400 }
    );
  }

  try {
    const outcome = await bulkImportPrograms(rows);
    return NextResponse.json({ outcome });
  } catch (err) {
    console.error("Bulk import failed:", err);
    return NextResponse.json(
      { errors: ["Import failed while saving. No changes were made."] },
      { status: 500 }
    );
  }
}
