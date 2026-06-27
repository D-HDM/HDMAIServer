const crypto = require('crypto');
const ProjectKey = require('../models/ProjectKey');

const projectAuth = (project) => async (req, res, next) => {
  const key = req.header('Authorization')?.replace('Bearer ', '');
  if (!key) return res.status(401).json({ success: false, error: 'API key required.' });

  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  const projectKey = await ProjectKey.findOne({ keyHash, project, isActive: true });

  if (!projectKey) return res.status(401).json({ success: false, error: 'Invalid or inactive API key.' });

  projectKey.lastUsed = new Date();
  projectKey.totalRequests += 1;
  await projectKey.save();

  req.projectKey = projectKey;
  next();
};

module.exports = projectAuth;