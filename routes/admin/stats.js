const router = require('express').Router();
const ctrl = require('../../controllers/admin/statsController');
const { adminAuth } = require('../../middleware/adminAuth');

router.get('/', adminAuth, ctrl.dashboard);
router.get('/usage', adminAuth, ctrl.usage);

module.exports = router;