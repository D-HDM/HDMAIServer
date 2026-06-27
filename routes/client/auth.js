const router = require('express').Router();
const ctrl = require('../../controllers/client/authController');
const auth = require('../../middleware/auth');
const rateLimit = require('../../middleware/rateLimit');

router.post('/register', rateLimit(5), ctrl.register);
router.post('/verify-email', ctrl.verifyEmail);
router.post('/login', rateLimit(10), ctrl.login);
router.post('/forgot-password', rateLimit(5), ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);
router.delete('/account', auth, ctrl.deleteAccount);
router.put('/profile', auth, ctrl.updateProfile);
router.put('/password', auth, ctrl.changePassword);

module.exports = router;