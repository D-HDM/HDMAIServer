const Redis = require('ioredis');
const config = require('./index');

let redis = null;

const connectRedis = () => {
  if (!config.redisEnabled) return null;

  try {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('error', (err) => console.warn('Redis: ERROR —', err.message));
    return redis;
  } catch (error) {
    console.warn('Redis: FAILED —', error.message);
    return null;
  }
};

const getRedis = () => redis;

module.exports = { connectRedis, getRedis };