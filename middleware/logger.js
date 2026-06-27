const config = require('../config');

const logger = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    if (statusCode >= 400) {
      const level = statusCode >= 500 ? '❌' : '⚠️';
      console.log(`[${level}] ${method} ${originalUrl} ${statusCode} ${duration}ms — ${ip}`);
    } else if (config.isDev) {
      console.log(`[✓] ${method} ${originalUrl} ${statusCode} ${duration}ms — ${ip}`);
    }
  });

  next();
};

module.exports = logger;