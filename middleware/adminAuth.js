const jwt = require('jsonwebtoken');
const config = require('../config');

const adminAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, config.adminJwtSecret);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired admin token.' });
  }
};

const requireSuperAdmin = (req, res, next) => {
  if (req.admin?.role !== 'super') {
    return res.status(403).json({ success: false, error: 'Super admin access required.' });
  }
  next();
};

module.exports = { adminAuth, requireSuperAdmin };