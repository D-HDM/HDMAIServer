const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const upload = multer({ dest: path.join(__dirname, '../../uploads') });
const ctrl = require('../../controllers/client/chatController');
const auth = require('../../middleware/auth');

router.post('/:module', auth, upload.array('files', 5), ctrl.chat);
router.post('/:module/stream', auth, upload.array('files', 5), ctrl.streamChat);

module.exports = router;