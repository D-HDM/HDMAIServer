const config = require('../config');

const internalAuth = (req, res, next) => {
  const secret = req.header('X-Internal-Secret');
  if (!secret || secret !== config.internalApiSecret) {
    return res.status(403).json({ success: false, error: 'Forbidden.' });
  }
  next();
};

module.exports = internalAuth;