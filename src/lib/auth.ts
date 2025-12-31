import crypto from "crypto";

function getSecret() {
  const secret = process.env.APP_SECRET || "";
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && (!secret || secret === "dev-secret-change-me")) {
    throw new Error("APP_SECRET must be set to a strong value in production");
  }
  return secret || "dev-secret-change-me";
}

const COOKIE_NAME = "feelos_session";
const TOKEN_TTL = 60 * 60 * 24 * 7; // 7 days

type SessionPayload = Record<string, unknown> & {
  userId?: string;
  iat?: number;
  exp?: number;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function base64url(input: string) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function signSession(payload: Record<string, unknown>) {
  const SECRET = getSecret();
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + TOKEN_TTL };
  const bodyJson = JSON.stringify(body);
  const bodyB64 = base64url(bodyJson);
  const hmac = crypto.createHmac("sha256", SECRET).update(bodyB64).digest("hex");
  const token = `${bodyB64}.${hmac}`;
  return { token, maxAge: TOKEN_TTL };
}

export function verifySession(token?: string) {
  try {
    const SECRET = getSecret();
    if (!token) return { valid: false };
    const [bodyB64, sig] = token.split(".");
    if (!bodyB64 || !sig) return { valid: false };
    const expected = crypto.createHmac("sha256", SECRET).update(bodyB64).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return { valid: false };
    const json = Buffer.from(bodyB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const parsed: unknown = JSON.parse(json);
    if (!isRecord(parsed)) return { valid: false };
    const payload = parsed as SessionPayload;
    if (typeof payload.exp === "number" && Math.floor(Date.now() / 1000) > payload.exp) return { valid: false };
    return { valid: true as const, payload };
  } catch {
    return { valid: false };
  }
}

export function cookieForToken(token: string, maxAge: number) {
  const isProd = process.env.NODE_ENV === "production";
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAge}`,
  ];
  if (isProd) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie() {
  const isProd = process.env.NODE_ENV === "production";
  const parts = [`${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`];
  if (isProd) parts.push("Secure");
  return parts.join("; ");
}

export function getTokenFromCookie(cookieHeader?: string | null) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(`${COOKIE_NAME}=`)) return decodeURIComponent(p.split("=")[1] || "");
  }
  return null;
}
