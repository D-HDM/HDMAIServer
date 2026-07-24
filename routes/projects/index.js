const router = require('express').Router();
const ctrl = require('../../controllers/project/chatController');
const projectAuth = require('../../middleware/projectAuth');
const rvnpCtrl = require('../../controllers/project/rvnpController');

router.post('/:module/chat', (req, res, next) => projectAuth(req.params.module)(req, res, next), ctrl.chat);
router.post('/:module/chat/stream', (req, res, next) => projectAuth(req.params.module)(req, res, next), ctrl.streamChat);

router.post('/:module/public-chat', (req, res, next) => projectAuth(req.params.module)(req, res, next), ctrl.publicChat);


router.post('/rvnp/moderate', (req, res, next) => projectAuth('rvnp')(req, res, next), rvnpCtrl.moderate);
router.post('/rvnp/verify-document', (req, res, next) => projectAuth('rvnp')(req, res, next), rvnpCtrl.verifyDocument);
router.post('/rvnp/rank-feed', (req, res, next) => projectAuth('rvnp')(req, res, next), rvnpCtrl.rankFeed);
router.post('/rvnp/suggest-replies', (req, res, next) => projectAuth('rvnp')(req, res, next), rvnpCtrl.suggestReplies);
router.post('/rvnp/trending', (req, res, next) => projectAuth('rvnp')(req, res, next), rvnpCtrl.trending);
router.post('/rvnp/chat', (req, res, next) => projectAuth('rvnp')(req, res, next), rvnpCtrl.chat);
module.exports = router;