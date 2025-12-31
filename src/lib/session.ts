import crypto from "crypto";

import { cookieForToken, getTokenFromCookie, signSession, verifySession } from "./auth";
import { prisma } from "./prisma";

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function makeGuestUserId() {
  const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `guest_${id}`;
}

async function ensureUserExists(userId: string) {
  try {
    if (!process.env.DATABASE_URL) return;
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (existing) return;
    await prisma.user.create({ data: { id: userId, name: "Guest", email: null } });
  } catch {
    // best-effort; auth/session should not fail hard if DB is momentarily unavailable
  }
}

export function getSessionUserId(req: Request): string | null {
  const cookie = req.headers.get("cookie") ?? "";
  const token = getTokenFromCookie(cookie);
  const v = verifySession(token ?? undefined);
  const userId = v.valid ? (v.payload as { userId?: unknown } | undefined)?.userId : undefined;
  return isNonEmptyString(userId) ? userId : null;
}

export function getOrCreateSessionUserId(req: Request): { userId: string; setCookie?: string } {
  const existing = getSessionUserId(req);
  if (existing) {
    void ensureUserExists(existing);
    return { userId: existing };
  }

  const userId = makeGuestUserId();
  const { token, maxAge } = signSession({ userId });
  const setCookie = cookieForToken(token, maxAge);

  void ensureUserExists(userId);
  return { userId, setCookie };
}
