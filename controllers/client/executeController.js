const axios = require('axios');
const config = require('../../config');
const usageService = require('../../services/usageService');

const execute = async (req, res, next) => {
  try {
    const { language, code, stdin } = req.body;
    const userId = req.user.sub;

    const response = await axios.post(
      `${config.pythonAiUrl}/v1/execute`,
      { user_id: userId, language, code, stdin },
      { timeout: 30000 }
    );

    const body = response.data?.data || response.data;

    await usageService.log({
      userId,
      module: 'chat',
      provider: 'HDM AI',
      endpoint: '/execute',
      model: 'HDM Nova',
      tokensUsed: 0,
      status: body.success ? 'success' : 'error',
    });

    res.json({ success: true, data: body });
  } catch (err) {
    console.error('Execute failed:', err.message);
    res.status(500).json({ success: false, error: 'Execution engine unavailable.' });
  }
};

const languages = async (req, res, next) => {
  try {
    const response = await axios.get(`${config.pythonAiUrl}/v1/execute/languages`, { timeout: 10000 });
    const body = response.data?.data || response.data;
    res.json({ success: true, data: body });
  } catch (err) {
    console.error('Languages failed:', err.message);
    res.status(500).json({ success: false, error: 'Execution engine unavailable.' });
  }
};

module.exports = { execute, languages };