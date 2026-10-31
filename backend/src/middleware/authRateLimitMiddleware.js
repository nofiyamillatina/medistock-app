const windows = new Map();
let requestsSinceCleanup = 0;
const MAX_TRACKED_KEYS = 10000;

const cleanupExpiredWindows = (now) => {
  requestsSinceCleanup += 1;
  if (requestsSinceCleanup < 256 && windows.size < MAX_TRACKED_KEYS) return;
  requestsSinceCleanup = 0;
  for (const [key, entry] of windows) {
    if (entry.expiresAt <= now) windows.delete(key);
  }
};

export const createAuthRateLimiter = ({ key, max, windowMs }) => (req, res, next) => {
  const now = Date.now();
  cleanupExpiredWindows(now);
  const address = req.ip || req.socket?.remoteAddress || 'unknown';
  const bucketKey = `${key}:${address}`;
  let entry = windows.get(bucketKey);

  if (!entry || entry.expiresAt <= now) {
    if (!entry && windows.size >= MAX_TRACKED_KEYS) {
      return res.status(429).json({ success: false, message: 'Terlalu banyak permintaan login. Coba lagi beberapa saat.' });
    }
    entry = { count: 0, expiresAt: now + windowMs };
    windows.set(bucketKey, entry);
  }

  if (entry.count >= max) {
    res.set('Retry-After', String(Math.max(1, Math.ceil((entry.expiresAt - now) / 1000))));
    return res.status(429).json({ success: false, message: 'Terlalu banyak percobaan. Coba lagi setelah beberapa saat.' });
  }

  entry.count += 1;
  return next();
};

export const platformAdminLoginRateLimit = createAuthRateLimiter({
  key: 'platform-admin-login',
  max: 10,
  windowMs: 10 * 60 * 1000
});

export const pharmacyLoginRateLimit = createAuthRateLimiter({
  key: 'pharmacy-login',
  max: 30,
  windowMs: 10 * 60 * 1000
});

export const customerLoginRateLimit = createAuthRateLimiter({
  key: 'customer-login',
  max: 30,
  windowMs: 10 * 60 * 1000
});

export const customerRegisterRateLimit = createAuthRateLimiter({
  key: 'customer-register',
  max: 10,
  windowMs: 10 * 60 * 1000
});
