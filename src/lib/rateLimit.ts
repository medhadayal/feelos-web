type Bucket = { windowStart: number; count: number };

const buckets = new Map<string, Bucket>();

const MAX_BUCKETS = 5000;

function nowMs() {
  return Date.now();
}

function getIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export function rateLimit(req: Request, opts: { key: string; limit: number; windowMs: number }) {
  const ip = getIp(req);
  const bucketKey = `${opts.key}:${ip}`;
  const t = nowMs();

  // Best-effort cleanup to avoid unbounded growth.
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (t - b.windowStart >= opts.windowMs * 2) buckets.delete(k);
      if (buckets.size <= MAX_BUCKETS) break;
    }
  }

  const existing = buckets.get(bucketKey);
  if (!existing || t - existing.windowStart >= opts.windowMs) {
    const b: Bucket = { windowStart: t, count: 1 };
    buckets.set(bucketKey, b);
    return { ok: true as const, remaining: opts.limit - 1, resetMs: b.windowStart + opts.windowMs };
  }

  existing.count++;
  buckets.set(bucketKey, existing);

  const remaining = Math.max(0, opts.limit - existing.count);
  const ok = existing.count <= opts.limit;
  return { ok, remaining, resetMs: existing.windowStart + opts.windowMs };
}
