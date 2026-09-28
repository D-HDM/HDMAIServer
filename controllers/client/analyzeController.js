const axios = require('axios');
const config = require('../../config');
const usageService = require('../../services/usageService');

const analyze = async (req, res, next) => {
  try {
    const { content, analysis_type } = req.body;
    const userId = req.user.sub;

    const response = await axios.post(
      `${config.pythonAiUrl}/v1/analyze`,
      { user_id: userId, content, analysis_type },
      { timeout: 30000 }
    );

    const body = response.data?.data || response.data;

    await usageService.log({
      userId,
      module: 'chat',
      provider: 'HDM AI',
      endpoint: '/analyze',
      model: 'HDM Nova',
      tokensUsed: 0,
      status: 'success',
    });

    res.json({ success: true, data: body });
  } catch (err) {
    console.error('Analyze failed:', err.message);
    res.status(500).json({ success: false, error: 'Analysis engine unavailable.' });
  }
};

module.exports = { analyze };