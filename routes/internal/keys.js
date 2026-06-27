const router = require('express').Router();
const AiProviderKey = require('../../models/AiProviderKey');
const internalAuth = require('../../middleware/internalAuth');

router.get('/keys', internalAuth, async (req, res) => {
  const keys = await AiProviderKey.find({ isActive: true });
  const data = keys.map(k => ({
    module: k.module,
    provider: k.provider,
    apiKey: k.getDecryptedKey(),
    model: k.model,
    isActive: k.isActive,
  }));
  res.json({ success: true, keys: data });
});

module.exports = router;