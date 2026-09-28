const router = require('express').Router();
const ctrl = require('../../controllers/client/executeController');
const auth = require('../../middleware/auth');

router.post('/', auth, ctrl.execute);
router.get('/languages', auth, ctrl.languages);

module.exports = router;