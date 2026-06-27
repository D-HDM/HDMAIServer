const router = require('express').Router();
const ctrl = require('../../controllers/client/conversationController');
const auth = require('../../middleware/auth');

router.get('/', auth, ctrl.list);
router.get('/:id', auth, ctrl.getMessages);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;