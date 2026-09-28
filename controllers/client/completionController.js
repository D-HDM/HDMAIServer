const axios = require('axios');
const config = require('../../config');
const usageService = require('../../services/usageService');
const ProjectKey = require('../../models/ProjectKey');

const completion = async (req, res, next) => {
  try {
    const { message, messages, system_prompt, temperature, max_tokens, data } = req.body;
    const projectKey = req.projectKey;

    const response = await axios.post(
      `${config.pythonAiUrl}/v1/completion`,
      { user_id: projectKey.userId?.toString() || 'external', message, messages, system_prompt, temperature, max_tokens, data },
      { timeout: 60000 }
    );

    const body = response.data?.data || response.data;
    const reply = body.reply || 'No response.';
    const tokens = body.tokens_used || 0;

    if (projectKey) {
      projectKey.totalRequests += 1;
      projectKey.tokensUsed += tokens;
      projectKey.lastUsed = new Date();
      await projectKey.save();
    }

    await usageService.log({
      userId: projectKey?.userId || null,
      module: 'completion',
      provider: 'HDM AI',
      endpoint: '/completion',
      model: body.model || 'HDM Nova',
      tokensUsed: tokens,
      status: 'success',
    });

    res.json({
      success: true,
      data: {
        reply,
        model: body.model || 'HDM Nova',
        tokens_used: tokens,
        provider: body.provider || 'HDM AI',
      },
    });
  } catch (err) {
    console.error('Completion failed:', err.message);

    await usageService.log({
      userId: req.projectKey?.userId || null,
      module: 'completion',
      provider: 'HDM AI',
      endpoint: '/completion',
      tokensUsed: 0,
      status: 'error',
      errorMessage: err.message,
    });

    res.status(500).json({ success: false, error: 'AI engine unavailable.' });
  }
};

module.exports = { completion };