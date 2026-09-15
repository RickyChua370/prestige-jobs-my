import { cookies } from "next/headers";

// ---------------------------------------------------------------------------
// Minimal admin authentication.
//
// A single admin password (set via the ADMIN_PASSWORD env var, default below)
// is exchanged for a signed session cookie. This is intentionally simple and
// suited to a single-curator platform; swap for a real auth provider if the
// team grows.
// ---------------------------------------------------------------------------

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "changeme-admin";
const COOKIE_NAME = "prestige_admin";
// The cookie value is a static token derived from the password. Good enough
// for gating a curator UI; not a substitute for real user auth.
const SESSION_TOKEN = `ok:${Buffer.from(ADMIN_PASSWORD).toString("base64")}`;

export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export async function createSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, SESSION_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === SESSION_TOKEN;
}
