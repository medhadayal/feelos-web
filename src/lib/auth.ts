import crypto from "crypto";

const SECRET = process.env.APP_SECRET || "dev-secret-change-me";
const COOKIE_NAME = "feelos_session";
const TOKEN_TTL = 60 * 60 * 24 * 7; // 7 days

function base64url(input: string) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function signSession(payload: Record<string, any>) {
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
    if (!token) return { valid: false };
    const [bodyB64, sig] = token.split(".");
    if (!bodyB64 || !sig) return { valid: false };
    const expected = crypto.createHmac("sha256", SECRET).update(bodyB64).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return { valid: false };
    const json = Buffer.from(bodyB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const payload = JSON.parse(json);
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return { valid: false };
    return { valid: true, payload };
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
