const router = require('express').Router();
const ctrl = require('../../controllers/client/analyzeController');
const auth = require('../../middleware/auth');

router.post('/', auth, ctrl.analyze);

module.exports = router;