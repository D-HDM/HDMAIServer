const router = require('express').Router();
const { adminAuth } = require('../../middleware/adminAuth');
const mongoose = require('mongoose');
const { getRedis } = require('../../config/redis');
const config = require('../../config');
const axios = require('axios');

router.get('/', adminAuth, async (req, res) => {
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

  let pythonStatus = 'unreachable';
  let pythonVersion = '';
  let pythonUptime = 0;
  let pythonMemory = null;
  try {
    const py = await axios.get(`${config.pythonAiUrl}/health`, { timeout: 3000 });
    pythonStatus = py.data.status || 'healthy';
    pythonVersion = py.data.version || '';
    pythonUptime = py.data.uptime || 0;
    pythonMemory = py.data.memory || null;
  } catch {}

  const memUsage = process.memoryUsage();
  const uptime = process.uptime();

  res.json({
    success: true,
    data: {
      server: 'running',
      version: '1.0.0',
      environment: config.nodeEnv,
      uptime: Math.floor(uptime),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      },
      mongodb: mongoStatus,
      redis: redisStatus,
      groq_api: 'connected',
      gemini_api: 'connected',
      code_execution: 'local',
      python: {
        url: config.pythonAiUrl,
        status: pythonStatus,
        version: pythonVersion,
        uptime: pythonUptime,
        memory: pythonMemory,
      },
    },
  });
});

module.exports = router;