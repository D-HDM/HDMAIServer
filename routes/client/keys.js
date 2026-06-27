const router = require('express').Router();
const keyCtrl = require('../../controllers/client/keyController');
const tpCtrl = require('../../controllers/client/thirdPartyController');
const auth = require('../../middleware/auth');

router.post('/outbound', auth, keyCtrl.createKey);
router.get('/outbound', auth, keyCtrl.listKeys);
router.delete('/outbound/:id', auth, keyCtrl.revokeKey);

router.post('/third-party', auth, tpCtrl.addKey);
router.get('/third-party', auth, tpCtrl.listKeys);
router.put('/third-party/:id', auth, tpCtrl.updateKey);
router.delete('/third-party/:id', auth, tpCtrl.deleteKey);
router.post('/third-party/:id/test', auth, tpCtrl.testKey);

module.exports = router;