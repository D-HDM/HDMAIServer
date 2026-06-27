// ====================================================================================================
// HDM AI Server — Central Config
// ====================================================================================================

require('dotenv').config();

const config = {
  // App
  appName: process.env.APP_NAME || 'HDM AI',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 5000,
  isDev: process.env.NODE_ENV === 'development',

  // URLs
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:3001',
  pythonAiUrl: process.env.PYTHON_AI_URL || 'http://localhost:5002',

  // CORS
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(','),

  // MongoDB
  mongodbUrl: process.env.MONGODB_URL || 'mongodb://localhost:27017/hdm_ai',

  // Redis
  redisEnabled: process.env.REDIS_ENABLED === 'true',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT — Client
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret',
  jwtExpire: process.env.JWT_EXPIRE || '7d',

  // JWT — Admin
  adminJwtSecret: process.env.ADMIN_JWT_SECRET || 'dev-admin-jwt-secret',
  adminJwtExpire: process.env.ADMIN_JWT_EXPIRE || '7d',

  // Token Expiry
  verificationTokenExpire: process.env.VERIFICATION_TOKEN_EXPIRES_IN || '24h',
  resetTokenExpire: process.env.RESET_TOKEN_EXPIRES_IN || '1h',

  // Internal Service Auth
  internalApiSecret: process.env.INTERNAL_API_SECRET || 'dev-internal-secret',

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  rateLimitGlobal: parseInt(process.env.RATE_LIMIT_GLOBAL) || 100,
  rateLimitPerUser: parseInt(process.env.RATE_LIMIT_PER_USER) || 30,

  // File Uploads
  maxUploadSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB) || 10,
  uploadDir: process.env.UPLOAD_DIR || 'uploads',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',
};

module.exports = config;