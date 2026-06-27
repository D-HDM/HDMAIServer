const router = require('express').Router();
const ctrl = require('../../controllers/admin/userController');
const { adminAuth, requireSuperAdmin } = require('../../middleware/adminAuth');

router.get('/', adminAuth, ctrl.list);
router.get('/:id', adminAuth, ctrl.getOne);
router.put('/:id', adminAuth, ctrl.update);
router.delete('/:id', adminAuth, requireSuperAdmin, ctrl.remove);

module.exports = router;