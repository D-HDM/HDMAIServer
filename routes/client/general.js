const router = require('express').Router();
const axios = require('axios');
const config = require('../../config');
const auth = require('../../middleware/auth');

router.post('/analyze', auth, async (req, res) => {
  try {
    const { data } = await axios.post(`${config.pythonAiUrl}/api/v1/general/analyze`, { ...req.body, user_id: req.user.sub }, { timeout: 60000 });
    res.json(data);
  } catch (err) { res.status(500).json({ success: false, error: 'AI engine error.' }); }
});

router.post('/execute', auth, async (req, res) => {
  try {
    const { data } = await axios.post(`${config.pythonAiUrl}/api/v1/general/execute`, { ...req.body, user_id: req.user.sub }, { timeout: 30000 });
    res.json(data);
  } catch (err) { res.status(500).json({ success: false, error: 'AI engine error.' }); }
});

router.get('/execute/languages', auth, async (req, res) => {
  try {
    const { data } = await axios.get(`${config.pythonAiUrl}/api/v1/general/execute/languages`, { timeout: 10000 });
    res.json(data);
  } catch (err) { res.status(500).json({ success: false, error: 'AI engine error.' }); }
});

router.post('/image', auth, async (req, res) => {
  try {
    const { data } = await axios.post(`${config.pythonAiUrl}/api/v1/general/image`, { ...req.body, user_id: req.user.sub }, { timeout: 60000 });
    res.json(data);
  } catch (err) { res.status(500).json({ success: false, error: 'AI engine error.' }); }
});

router.post('/learn', auth, async (req, res) => {
  try {
    const { data } = await axios.post(`${config.pythonAiUrl}/api/v1/general/learn`, { ...req.body, user_id: req.user.sub }, { timeout: 60000 });
    res.json(data);
  } catch (err) { res.status(500).json({ success: false, error: 'AI engine error.' }); }
});

router.post('/learn/quiz', auth, async (req, res) => {
  try {
    const { data } = await axios.post(`${config.pythonAiUrl}/api/v1/general/learn/quiz`, { ...req.body, user_id: req.user.sub }, { timeout: 60000 });
    res.json(data);
  } catch (err) { res.status(500).json({ success: false, error: 'AI engine error.' }); }
});

router.post('/learn/quiz/submit', auth, async (req, res) => {
  try {
    const { data } = await axios.post(`${config.pythonAiUrl}/api/v1/general/learn/quiz/submit`, { ...req.body, user_id: req.user.sub }, { timeout: 60000 });
    res.json(data);
  } catch (err) { res.status(500).json({ success: false, error: 'AI engine error.' }); }
});

router.post('/learn/flashcards', auth, async (req, res) => {
  try {
    const { data } = await axios.post(`${config.pythonAiUrl}/api/v1/general/learn/flashcards`, { ...req.body, user_id: req.user.sub }, { timeout: 60000 });
    res.json(data);
  } catch (err) { res.status(500).json({ success: false, error: 'AI engine error.' }); }
});

module.exports = router;