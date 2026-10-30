const router = require('express').Router();
const ctrl = require('../../controllers/client/learnCompletionController');
const projectAuth = require('../../middleware/projectAuth');

router.post('/', projectAuth('completion'), ctrl.learnCompletion);

module.exports = router;