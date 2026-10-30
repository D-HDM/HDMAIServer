const router = require('express').Router();
const { getStatus } = require('../../services/chatStatus');
const auth = require('../../middleware/auth');

router.get('/:requestId', auth, (req, res) => {
  const status = getStatus(req.params.requestId);
  res.json({ success: true, data: status });
});

module.exports = router;