const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/chat', require('./chat'));
router.use('/completion', require('./completion'));
router.use('/execute', require('./execute'));
router.use('/analyze', require('./analyze'));
router.use('/image', require('./image'));
router.use('/learn', require('./learn'));
router.use('/conversations', require('./conversations'));
router.use('/keys', require('./keys'));
router.use('/support', require('./support'));

module.exports = router;