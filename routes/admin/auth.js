const router = require('express').Router();
const ctrl = require('../../controllers/admin/authController');
const rateLimit = require('../../middleware/rateLimit');

router.post('/login', rateLimit(5), ctrl.login);

module.exports = router;