const router = require('express').Router();
const ctrl = require('../../controllers/client/learnController');
const auth = require('../../middleware/auth');

router.get('/curriculum', auth, ctrl.listCurricula);
router.post('/curriculum', auth, ctrl.createCurriculum);
router.get('/curriculum/:id', auth, ctrl.getCurriculum);
router.delete('/curriculum/:id', auth, ctrl.deleteCurriculum);
router.post('/curriculum/:id/subtopic/:subId/chat', auth, ctrl.subtopicChat);
router.post('/curriculum/:id/subtopic/:subId/quiz', auth, ctrl.generateQuiz);
router.post('/curriculum/:id/subtopic/:subId/quiz/submit', auth, ctrl.submitQuiz);
router.post('/curriculum/:id/subtopic/:subId/flashcards', auth, ctrl.generateFlashcards);
router.post('/curriculum/:id/complete', auth, ctrl.completeCurriculum);

module.exports = router;