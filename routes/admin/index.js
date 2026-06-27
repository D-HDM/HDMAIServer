const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/keys', require('./keys'));
router.use('/stats', require('./stats'));
router.use('/settings', require('./settings'));
router.use('/health', require('./health'));

module.exports = router;