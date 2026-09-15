import { NextResponse } from "next/server";
import { deleteProgram, getProgram, updateProgram } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { parseProgramInput } from "@/lib/validate";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  return isAuthenticated();
}

// PUT /api/programs/:id — update (admin only).
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numId = Number(id);
  if (!(await getProgram(numId)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const { data, errors } = parseProgramInput(body);
  if (!data) return NextResponse.json({ errors }, { status: 400 });

  const program = await updateProgram(numId, data);
  return NextResponse.json({ program });
}

// DELETE /api/programs/:id — delete (admin only).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ok = await deleteProgram(Number(id));
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
