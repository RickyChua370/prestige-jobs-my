import { NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const password = (body as { password?: string } | null)?.password ?? "";
  if (!verifyPassword(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  await createSession();
  return NextResponse.json({ ok: true });
}
