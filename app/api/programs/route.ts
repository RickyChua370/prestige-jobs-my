import { NextResponse } from "next/server";
import { createProgram, listPrograms } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { parseProgramInput } from "@/lib/validate";

export const dynamic = "force-dynamic";

// GET /api/programs — public list of all programs.
export async function GET() {
  return NextResponse.json({ programs: await listPrograms() });
}

// POST /api/programs — create (admin only).
export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const { data, errors } = parseProgramInput(body);
  if (!data) return NextResponse.json({ errors }, { status: 400 });
  const program = await createProgram(data);
  return NextResponse.json({ program }, { status: 201 });
}
