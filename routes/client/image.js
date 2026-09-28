const router = require('express').Router();
const ctrl = require('../../controllers/client/imageController');
const auth = require('../../middleware/auth');

router.post('/', auth, ctrl.generate);

module.exports = router;