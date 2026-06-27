const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/keys', require('./keys'));
router.use('/chat', require('./chat'));
router.use('/conversations', require('./conversations'));
router.use('/general', require('./general'));

module.exports = router;