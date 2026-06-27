require('./scripts/dnsSet');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config');
const { connectRedis, getRedis } = require('./config/redis');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const keyResolver = require('./services/keyResolver');

const app = express();

app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', (req, res) => res.sendStatus(200));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.get('/', (req, res) => {
  res.json({
    name: config.appName,
    version: '1.0.0',
    status: 'running',
    environment: config.nodeEnv,
    docs: config.isDev ? '/docs' : null,
    health: '/health',
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: config.appName,
    version: '1.0.0',
    endpoints: {
      client: '/api/v1',
      admin: '/api/v1/admin',
      internal: '/api/v1/internal',
    },
  });
});

app.get('/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  let redisStatus = 'disabled';
  if (config.redisEnabled) {
    const r = getRedis();
    if (r) {
      try {
        await r.ping();
        redisStatus = 'connected';
      } catch {
        redisStatus = 'disconnected';
      }
    } else {
      redisStatus = 'disconnected';
    }
  }
  res.json({
    status: mongoStatus === 'connected' ? 'healthy' : 'degraded',
    server: 'running',
    version: '1.0.0',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    mongodb: mongoStatus,
    redis: redisStatus,
    python: config.pythonAiUrl,
  });
});

app.use('/api/v1/internal', require('./routes/internal/keys'));
app.use('/api/v1/projects', require('./routes/projects'));
app.use('/api/v1', require('./routes'));

app.use(errorHandler);

const PORT = config.port;

async function start() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log(`║  ${config.appName} Server v1.0.0                   ║`);
  console.log(`║  Environment: ${config.nodeEnv.padEnd(34)}║`);
  console.log(`║  Port: ${String(PORT).padEnd(38)}║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  const isAtlas = config.mongodbUrl.includes('mongodb+srv') || config.mongodbUrl.includes('mongodb.net');
  const location = isAtlas ? 'Atlas' : 'localhost';

  try {
    await mongoose.connect(config.mongodbUrl, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    const dbName = mongoose.connection.db.databaseName;
    console.log(`MongoDB: CONNECTED — ${dbName} @ ${location}`);
  } catch (err) {
    console.error(`MongoDB: FAILED @ ${location} —`, err.message);
    process.exit(1);
  }

  let redisState = 'DISABLED';
  if (config.redisEnabled) {
    const r = connectRedis();
    if (r) {
      try {
        await r.ping();
        redisState = 'CONNECTED';
      } catch {
        redisState = 'DISCONNECTED';
      }
    } else {
      redisState = 'DISCONNECTED';
    }
  }
  console.log(`Redis: ${redisState}`);

  await keyResolver.refresh();
  console.log(`Key Resolver: Loaded\n`);

  const server = app.listen(PORT, () => {
    console.log(`Server running on ${config.baseUrl}`);
    console.log(`Client: ${config.clientUrl}`);
    console.log(`Admin:  ${config.adminUrl}`);
    console.log(`Python: ${config.pythonAiUrl}\n`);
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await mongoose.disconnect();
      const r = getRedis();
      if (r) await r.quit();
      console.log('Server shut down.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();