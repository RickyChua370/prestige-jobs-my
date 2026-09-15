import { listPrograms } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { programsToCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

// GET /api/programs/export — download all programmes as CSV (admin only).
export async function GET() {
  if (!(await isAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }
  const csv = programsToCsv(await listPrograms());
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prestige-jobs-${date}.csv"`,
    },
  });
}
