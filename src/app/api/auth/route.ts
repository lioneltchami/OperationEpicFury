import { NextRequest, NextResponse } from "next/server";
import { generateSessionToken, createSession, destroySession, COOKIE_NAME, SESSION_TTL } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { cookies } from "next/headers";

const MAX_LOGIN_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60; // 15 minutes

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit login attempts by IP
  const { allowed, retryAfterSeconds } = await checkRateLimit(
    `auth:${ip}`,
    MAX_LOGIN_ATTEMPTS,
    WINDOW_SECONDS,
  );

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      },
    );
  }

  const { password } = (await req.json()) as { password?: string };
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // Generate random session token and store in Redis
  const token = generateSessionToken();
  await createSession(token);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
  return res;
}

export async function DELETE() {
  // Destroy the session in Redis before clearing the cookie
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await destroySession(token);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
