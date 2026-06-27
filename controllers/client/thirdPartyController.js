const ThirdPartyKey = require('../../models/ThirdPartyKey');
const { encrypt } = require('../../utils/encryption');
const axios = require('axios');

// @desc    Add external API key
// @route   POST /api/v1/keys/third-party
// @access  Private
const addKey = async (req, res, next) => {
  try {
    const { provider, name, apiKey, baseUrl, apiStructure } = req.body;
    const key = await ThirdPartyKey.create({
      userId: req.user.sub,
      provider,
      name: name || provider,
      encryptedKey: encrypt(apiKey),
      baseUrl,
      apiStructure: apiStructure || {},
    });
    res.status(201).json({ success: true, data: key, message: 'Key stored securely.' });
  } catch (err) { next(err); }
};

// @desc    List user's third-party keys
// @route   GET /api/v1/keys/third-party
// @access  Private
const listKeys = async (req, res, next) => {
  try {
    const keys = await ThirdPartyKey.find({ userId: req.user.sub, isActive: true }).sort('-createdAt');
    res.json({ success: true, data: keys });
  } catch (err) { next(err); }
};

// @desc    Update third-party key
// @route   PUT /api/v1/keys/third-party/:id
// @access  Private
const updateKey = async (req, res, next) => {
  try {
    const key = await ThirdPartyKey.findOne({ _id: req.params.id, userId: req.user.sub });
    if (!key) return res.status(404).json({ success: false, error: 'Key not found.' });

    if (req.body.name !== undefined) key.name = req.body.name;
    if (req.body.apiKey) key.encryptedKey = encrypt(req.body.apiKey);
    if (req.body.baseUrl !== undefined) key.baseUrl = req.body.baseUrl;
    if (req.body.apiStructure) key.apiStructure = req.body.apiStructure;
    if (req.body.isActive !== undefined) key.isActive = req.body.isActive;
    await key.save();

    res.json({ success: true, data: key, message: 'Key updated.' });
  } catch (err) { next(err); }
};

// @desc    Delete third-party key
// @route   DELETE /api/v1/keys/third-party/:id
// @access  Private
const deleteKey = async (req, res, next) => {
  try {
    const key = await ThirdPartyKey.findOneAndDelete({ _id: req.params.id, userId: req.user.sub });
    if (!key) return res.status(404).json({ success: false, error: 'Key not found.' });
    res.json({ success: true, message: 'Key deleted.' });
  } catch (err) { next(err); }
};

// @desc    Test third-party key
// @route   POST /api/v1/keys/third-party/:id/test
// @access  Private
const testKey = async (req, res, next) => {
  try {
    const key = await ThirdPartyKey.findOne({ _id: req.params.id, userId: req.user.sub });
    if (!key) return res.status(404).json({ success: false, error: 'Key not found.' });

    const start = Date.now();
    try {
      const resp = await axios.get(key.baseUrl, {
        headers: { Authorization: `Bearer ${key.getDecryptedKey()}` },
        timeout: 10000,
      });
      const elapsed = Date.now() - start;
      key.lastTested = new Date();
      key.isVerified = resp.status < 400;
      key.testResult = `HTTP ${resp.status}`;
      await key.save();
      res.json({ success: true, data: { success: key.isVerified, statusCode: resp.status, responseTimeMs: elapsed } });
    } catch (err) {
      const elapsed = Date.now() - start;
      key.lastTested = new Date();
      key.isVerified = false;
      key.testResult = err.message.slice(0, 100);
      await key.save();
      res.json({ success: true, data: { success: false, message: err.message, responseTimeMs: elapsed } });
    }
  } catch (err) { next(err); }
};

module.exports = { addKey, listKeys, updateKey, deleteKey, testKey };