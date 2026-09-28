const router = require('express').Router();
const multer = require('multer');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Prefer UPLOAD_DIR, then os.tmpdir() everywhere. Only fall back to
// a local ./uploads folder when explicitly in development.
const isDev = process.env.NODE_ENV === 'development';

const uploadDir =
  process.env.UPLOAD_DIR ||
  (isDev ? path.join(__dirname, '../../uploads') : os.tmpdir());

// Make sure it exists and is writable, but never crash the app if not.
try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (err) {
  console.warn(`[upload] Could not create upload dir "${uploadDir}": ${err.message}. Falling back to memory storage.`);
}

// If the dir isn't usable, fall back to memory storage so the app still boots.
let storage;
try {
  fs.accessSync(uploadDir, fs.constants.W_OK);
  storage = multer.diskStorage({ destination: uploadDir });
} catch {
  storage = multer.memoryStorage();
}

const upload = multer({ storage });

const ctrl = require('../../controllers/client/chatController');
const auth = require('../../middleware/auth');

router.post('/', auth, upload.array('files', 5), ctrl.chat);
router.post('/stream', auth, upload.array('files', 5), ctrl.streamChat);

module.exports = router;