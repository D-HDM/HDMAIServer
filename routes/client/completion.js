const router = require('express').Router();
const ctrl = require('../../controllers/client/completionController');
const projectAuth = require('../../middleware/projectAuth');

router.post('/', projectAuth('completion'), ctrl.completion);

module.exports = router;