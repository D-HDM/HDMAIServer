const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');

const generateToken = (userId, role = 'user') => {
  const secret = role === 'admin' ? config.adminJwtSecret : config.jwtSecret;
  const expiresIn = role === 'admin' ? config.adminJwtExpire : config.jwtExpire;
  return jwt.sign({ sub: userId, role }, secret, { expiresIn });
};

const generateVerificationToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return { token, hash, expires };
};

const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  return { token, hash, expires };
};

const generateApiKey = (prefix = 'hdm_gen_') => {
  const random = crypto.randomBytes(24).toString('hex');
  return prefix + random;
};

const hashApiKey = (key) => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

module.exports = { generateToken, generateVerificationToken, generateResetToken, generateApiKey, hashApiKey };