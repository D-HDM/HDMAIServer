const router = require('express').Router();
const ctrl = require('../../controllers/admin/keyController');
const { adminAuth, requireSuperAdmin } = require('../../middleware/adminAuth');

router.get('/ai', adminAuth, ctrl.listAiKeys);
router.put('/ai', adminAuth, requireSuperAdmin, ctrl.upsertAiKey);
router.delete('/ai/:id', adminAuth, requireSuperAdmin, ctrl.deleteAiKey);

router.get('/project', adminAuth, ctrl.listProjectKeys);
router.post('/project', adminAuth, ctrl.createProjectKey);
router.delete('/project/:id', adminAuth, ctrl.revokeProjectKey);

module.exports = router;