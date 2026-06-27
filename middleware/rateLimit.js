const { getRedis } = require('../config/redis');
const config = require('../config');

const rateLimit = (maxRequests = config.rateLimitPerUser) => async (req, res, next) => {
  if (!config.redisEnabled) return next();

  const redis = getRedis();
  if (!redis) return next();

  const key = req.user?.sub || req.ip;
  const redisKey = `rate:${key}`;

  try {
    const current = await redis.incr(redisKey);
    if (current === 1) await redis.expire(redisKey, Math.ceil(config.rateLimitWindowMs / 1000));
    if (current > maxRequests) {
      return res.status(429).json({ success: false, error: 'Too many requests. Slow down.' });
    }
    next();
  } catch (err) {
    next(); // fail open
  }
};

module.exports = rateLimit;