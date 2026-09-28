const router = require('express').Router();
const multer = require('multer');
const os = require('os');
const path = require('path');

const uploadDir = process.env.NODE_ENV === 'production'
  ? os.tmpdir()
  : path.join(__dirname, '../../uploads');

const upload = multer({ dest: uploadDir });
const ctrl = require('../../controllers/client/chatController');
const auth = require('../../middleware/auth');

router.post('/:module', auth, upload.array('files', 5), ctrl.chat);
router.post('/:module/stream', auth, upload.array('files', 5), ctrl.streamChat);

module.exports = router;