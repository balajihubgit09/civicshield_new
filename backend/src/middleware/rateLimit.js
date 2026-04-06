import { config } from "../config.js";

function getClientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip || req.socket.remoteAddress || "unknown";
}

function createRateLimiter({ windowMs, max, label }) {
  const buckets = new Map();

  return function rateLimiter(req, res, next) {
    const now = Date.now();
    const key = `${label}:${getClientKey(req)}`;
    const current = buckets.get(key);

    if (!current || current.expiresAt <= now) {
      buckets.set(key, {
        count: 1,
        expiresAt: now + windowMs
      });
      return next();
    }

    current.count += 1;

    if (current.count > max) {
      const retryAfter = Math.ceil((current.expiresAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: "RATE_LIMITED",
        message: "Too many requests. Please retry after the cooldown window."
      });
    }

    return next();
  };
}

export const claimsRateLimiter = createRateLimiter({
  windowMs: config.claimsRateWindowMs,
  max: config.claimsRateMax,
  label: "claims"
});

export const adminRateLimiter = createRateLimiter({
  windowMs: config.adminRateWindowMs,
  max: config.adminRateMax,
  label: "admin"
});
