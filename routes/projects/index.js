const router = require('express').Router();
const ctrl = require('../../controllers/project/chatController');
const projectAuth = require('../../middleware/projectAuth');

router.post('/:module/chat', (req, res, next) => projectAuth(req.params.module)(req, res, next), ctrl.chat);
router.post('/:module/chat/stream', (req, res, next) => projectAuth(req.params.module)(req, res, next), ctrl.streamChat);

module.exports = router;