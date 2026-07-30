const router = require('express').Router();
const ctrl = require('../../controllers/admin/supportController');
const { adminAuth } = require('../../middleware/adminAuth');

router.get('/', adminAuth, ctrl.getSupportContent);
router.put('/', adminAuth, ctrl.updateSupportContent);

module.exports = router;