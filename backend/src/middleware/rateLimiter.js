/**
 * Rate Limiter Middleware
 *
 * Strategy overview:
 * ┌─────────────────────┬──────────┬──────────┬────────────────────────────┐
 * │ Limiter             │ Window   │ Max reqs │ Applied to                 │
 * ├─────────────────────┼──────────┼──────────┼────────────────────────────┤
 * │ globalLimiter       │ 15 min   │ 300      │ All /api/* routes          │
 * │ authLimiter         │ 15 min   │ 10       │ POST /auth/login, /register│
 * │ strictAuthLimiter   │ 1 hour   │ 5        │ Failed login attempts      │
 * │ apiLimiter          │ 1 min    │ 60       │ Authenticated API calls    │
 * │ expenseLimiter      │ 1 min    │ 30       │ POST /expenses             │
 * │ settlementLimiter   │ 5 min    │ 20       │ POST /settlements          │
 * └─────────────────────┴──────────┴──────────┴────────────────────────────┘
 *
 * Storage: Redis (preferred) → in-memory fallback (single-node dev only)
 */

const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getRedisClient, isRedisAvailable } = require('../config/redis');

// ── Store factory ─────────────────────────────────────────
let redisStore = null;

const buildStore = async (prefix) => {
  try {
    const available = await isRedisAvailable();
    if (!available) {
      console.warn(`⚠️  Redis unavailable — rate-limiter [${prefix}] using in-memory store (not suitable for production with multiple nodes)`);
      return undefined; // express-rate-limit falls back to MemoryStore
    }

    const client = await getRedisClient();
    return new RedisStore({
      sendCommand: (...args) => client.sendCommand(args),
      prefix: `rl:${prefix}:`,
    });
  } catch (err) {
    console.warn(`⚠️  Rate-limiter Redis store failed (${prefix}):`, err.message);
    return undefined;
  }
};

// ── Key generators ────────────────────────────────────────

/** Use authenticated user ID if available, otherwise fall back to IP */
const userOrIpKey = (req) => {
  return req.user?.userId || req.ip;
};

/** Always key by IP (for pre-auth routes) */
const ipKey = (req) => req.ip;

// ── Response handler ──────────────────────────────────────
const onLimitReached = (req, res, options) => {
  console.warn(`[RateLimit] ${options.message} — IP: ${req.ip} | Path: ${req.path} | User: ${req.user?.userId || 'anon'}`);
};

// ── Limiter factory ───────────────────────────────────────
const makeLimiter = async ({ prefix, windowMs, max, message, keyGenerator = ipKey, skipSuccessfulRequests = false }) => {
  const store = await buildStore(prefix);

  return rateLimit({
    windowMs,
    max,
    message: { error: message, retryAfter: Math.ceil(windowMs / 1000) },
    standardHeaders: true,   // Return `RateLimit-*` headers
    legacyHeaders: false,     // Disable `X-RateLimit-*` headers
    keyGenerator,
    store,
    skipSuccessfulRequests,
    handler: (req, res, next, options) => {
      onLimitReached(req, res, options);
      res.status(options.statusCode).json(options.message);
    },
  });
};

// ── Named limiters (initialised lazily on first import) ──
let _limiters = null;

const getLimiters = async () => {
  if (_limiters) return _limiters;

  const [
    globalLimiter,
    authLimiter,
    strictAuthLimiter,
    apiLimiter,
    expenseLimiter,
    settlementLimiter,
    searchLimiter,
  ] = await Promise.all([
    // 1 – Global safety net: 300 req / 15 min per IP
    makeLimiter({
      prefix:    'global',
      windowMs:  15 * 60 * 1000,
      max:       300,
      message:   'Too many requests. Please slow down.',
    }),

    // 2 – Auth routes (login / register): 10 attempts / 15 min per IP
    makeLimiter({
      prefix:    'auth',
      windowMs:  15 * 60 * 1000,
      max:       10,
      message:   'Too many auth attempts. Try again in 15 minutes.',
    }),

    // 3 – Strict auth: 5 failed logins / hour → lock out IP
    //     (apply only when login returns 401 via skipSuccessfulRequests)
    makeLimiter({
      prefix:                 'auth_strict',
      windowMs:               60 * 60 * 1000,
      max:                    5,
      message:                'Too many failed login attempts. Account locked for 1 hour.',
      skipSuccessfulRequests: true,
    }),

    // 4 – Authenticated API: 60 req / min per user (or IP if anon)
    makeLimiter({
      prefix:       'api',
      windowMs:     60 * 1000,
      max:          60,
      message:      'API rate limit exceeded. Max 60 requests per minute.',
      keyGenerator: userOrIpKey,
    }),

    // 5 – Expense creation: 30 req / min per user (prevents bulk spam)
    makeLimiter({
      prefix:       'expense',
      windowMs:     60 * 1000,
      max:          30,
      message:      'Too many expenses created. Max 30 per minute.',
      keyGenerator: userOrIpKey,
    }),

    // 6 – Settlement creation: 20 req / 5 min per user
    makeLimiter({
      prefix:       'settlement',
      windowMs:     5 * 60 * 1000,
      max:          20,
      message:      'Too many settlements. Max 20 per 5 minutes.',
      keyGenerator: userOrIpKey,
    }),

    // 7 – Heavy read / search endpoints: 30 req / min per user
    makeLimiter({
      prefix:       'search',
      windowMs:     60 * 1000,
      max:          30,
      message:      'Search rate limit exceeded. Max 30 per minute.',
      keyGenerator: userOrIpKey,
    }),
  ]);

  _limiters = {
    globalLimiter,
    authLimiter,
    strictAuthLimiter,
    apiLimiter,
    expenseLimiter,
    settlementLimiter,
    searchLimiter,
  };

  return _limiters;
};

module.exports = { getLimiters };
