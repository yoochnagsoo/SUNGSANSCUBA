type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

type RateLimitResult =
  | {
      ok: true;
      remaining: number;
      resetAt: number;
    }
  | {
      ok: false;
      remaining: 0;
      resetAt: number;
      retryAfterSeconds: number;
    };

const store = new Map<string, RateLimitRecord>();

function cleanupExpiredRecords(now: number) {
  for (const [key, record] of store.entries()) {
    if (record.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();

  cleanupExpiredRecords(now);

  const current = store.get(options.key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + options.windowMs;

    store.set(options.key, {
      count: 1,
      resetAt,
    });

    return {
      ok: true,
      remaining: Math.max(options.limit - 1, 0),
      resetAt,
    };
  }

  if (current.count >= options.limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterSeconds: Math.max(
        Math.ceil((current.resetAt - now) / 1000),
        1,
      ),
    };
  }

  current.count += 1;
  store.set(options.key, current);

  return {
    ok: true,
    remaining: Math.max(options.limit - current.count, 0),
    resetAt: current.resetAt,
  };
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");

  if (realIp) {
    return realIp.trim();
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  return "unknown";
}