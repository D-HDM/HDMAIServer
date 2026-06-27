const usageService = require('../../services/usageService');
const mongoose = require('mongoose');
const axios = require('axios');
const config = require('../../config');

const chat = async (req, res, next) => {
  try {
    const { module } = req.params;
    const body = req.body;
    const projectKey = req.projectKey;

    const settings = await mongoose.connection.db.collection('settings').findOne({ type: 'ai_config' });
    const finalProvider = body.provider || settings?.defaultProvider || 'groq';
    const finalModel = body.model || settings?.defaultModel || 'llama-3.3-70b-versatile';
    const finalTemperature = body.temperature ?? settings?.temperature ?? 0.7;
    const finalMaxTokens = body.maxTokens || settings?.maxTokens || 1024;

    const pythonEndpoint = getPythonEndpoint(module);
    const payload = getPythonPayload(module, body, projectKey);
    payload.provider = finalProvider;
    payload.model = finalModel;
    payload.temperature = finalTemperature;
    payload.max_tokens = finalMaxTokens;

    const response = await axios.post(
      `${config.pythonAiUrl}/api/v1/${pythonEndpoint}`,
      payload,
      { timeout: 60000 }
    );

    const respBody = response.data?.data || response.data;
    const reply = respBody.reply || respBody.result?.reply || 'AI unavailable.';
    const tokens = respBody.tokens_used || respBody.tokensUsed || 0;
    const modelUsed = respBody.model || finalModel;

    projectKey.totalRequests += 1;
    projectKey.tokensUsed += tokens;
    projectKey.lastUsed = new Date();
    await projectKey.save();

    await usageService.log({ userId: projectKey.userId, module, provider: finalProvider, endpoint: '/projects/chat', model: modelUsed, tokensUsed: tokens, status: 'success' });

    res.json({ success: true, data: { reply, model: modelUsed, tokensUsed: tokens, provider: finalProvider } });
  } catch (err) {
    console.error(`Project chat failed [${req.params.module}]:`, err.message);
    res.status(500).json({ success: false, error: 'AI engine unavailable.' });
  }
};

function getPythonEndpoint(module) {
  const map = {
    general: 'general/chat',
    erp: 'erp/query',
    smartpos: 'smartpos/chat',
    spark: 'spark/chat/ask',
    vibe: 'vibe/chat/message',
    vault: 'vault/chat',
    widget: 'widget/chat',
  };
  return map[module] || `${module}/chat`;
}

function getPythonPayload(module, body, projectKey) {
  const base = {
    provider: body.provider,
    model: body.model,
    temperature: body.temperature,
    max_tokens: body.maxTokens,
    data: body.data,
  };

  switch (module) {
    case 'erp':
      return { ...base, query: body.message, tenant_id: body.tenant_id || projectKey.userId?.toString() || 'project' };
    case 'smartpos':
      return { ...base, message: body.message, client_id: body.client_id || projectKey.userId?.toString() || 'project', business_id: body.business_id };
    case 'spark':
      return { ...base, message: body.message, user_id: projectKey.userId?.toString() || 'project', language: body.language || 'en' };
    case 'vibe':
      return { ...base, message: body.message, user_id: projectKey.userId?.toString() || 'project' };
    case 'vault':
      return { ...base, message: body.message, user_id: projectKey.userId?.toString() || 'project', feature: body.feature || 'private' };
    case 'widget':
      return { ...base, message: body.message, source: body.source || 'hdm_portfolio', user_id: projectKey.userId?.toString() || 'project' };
    default:
      return { ...base, message: body.message, user_id: projectKey.userId?.toString() || 'project' };
  }
}

const streamChat = async (req, res, next) => {
  res.status(501).json({ success: false, error: 'Streaming not available for projects.' });
};

module.exports = { chat, streamChat };