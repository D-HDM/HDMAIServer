const router = require('express').Router();
const SupportContent = require('../../models/SupportContent');

router.get('/', async (req, res) => {
  try {
    const content = await SupportContent.findOne({ type: 'support_content' });
    res.json({ success: true, data: content || {} });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load support content.' });
  }
});

module.exports = router;