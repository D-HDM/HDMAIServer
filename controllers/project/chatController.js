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

    const { endpoint, payload } = getPythonRequest(module, body, projectKey);
    payload.provider = finalProvider;
    payload.model = finalModel;
    payload.temperature = finalTemperature;
    payload.max_tokens = finalMaxTokens;

    const response = await axios.post(
      `${config.pythonAiUrl}/api/v1/${endpoint}`,
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

const publicChat = async (req, res, next) => {
  try {
    const { module } = req.params;
    const { message, system_prompt, provider } = req.body;
    const projectKey = req.projectKey;

    const settings = await mongoose.connection.db.collection('settings').findOne({ type: 'ai_config' });
    const finalProvider = provider || settings?.defaultProvider || 'groq';

    const messages = [];
    if (system_prompt) {
      messages.push({ role: 'system', content: system_prompt });
    }
    messages.push({ role: 'user', content: message });

    const response = await axios.post(
      `${config.pythonAiUrl}/api/v1/general/chat`,
      { message: message, messages: messages, user_id: projectKey.userId?.toString() || 'public', provider: finalProvider },
      { timeout: 60000 }
    );

    const body = response.data?.data || response.data;
    const reply = body.reply || 'AI unavailable.';
    const tokens = body.tokens_used || body.tokensUsed || 0;

    projectKey.totalRequests += 1;
    projectKey.tokensUsed += tokens;
    projectKey.lastUsed = new Date();
    await projectKey.save();

    await usageService.log({ userId: projectKey.userId, module, provider: finalProvider, endpoint: '/projects/public-chat', model: finalProvider, tokensUsed: tokens, status: 'success' });

    res.json({ success: true, data: { reply, tokens_used: tokens, provider: finalProvider } });
  } catch (err) {
    console.error(`Public chat failed:`, err.message);
    res.status(500).json({ success: false, error: 'AI engine unavailable.' });
  }
};

function getPythonRequest(module, body, projectKey) {
  const isPublic = body.is_public === true;
  const userId = projectKey.userId?.toString() || 'project';

  switch (module) {
    case 'general':
      return {
        endpoint: isPublic ? 'general/chat' : 'general/chat',
        payload: { message: body.message, user_id: userId, data: body.data }
      };
    case 'erp':
      return {
        endpoint: isPublic ? 'erp/public/chat' : 'erp/query',
        payload: { query: body.message, tenant_id: body.tenant_id || userId, context: body.context, data: body.data }
      };
    case 'smartpos':
      return {
        endpoint: isPublic ? 'smartpos/public/chat' : 'smartpos/chat',
        payload: { message: body.message, client_id: body.client_id || userId, business_id: body.business_id, feature: isPublic ? 'public' : 'chat', data: body.data }
      };
    case 'spark':
      return {
        endpoint: isPublic ? 'spark/public/chat' : 'spark/chat/ask',
        payload: { message: body.message, user_id: userId, language: body.language || 'en', data: body.data, feature: isPublic ? 'public' : 'private' }
      };
    case 'vibe':
      return {
        endpoint: isPublic ? 'vibe/public/chat' : 'vibe/chat/message',
        payload: { message: body.message, user_id: userId, data: body.data, feature: isPublic ? 'public' : 'private' }
      };
    case 'vault':
      return {
        endpoint: isPublic ? 'vault/public/chat' : 'vault/chat',
        payload: { message: body.message, user_id: userId, feature: isPublic ? 'public' : 'private', data: body.data }
      };
    case 'widget':
      return {
        endpoint: 'widget/chat',
        payload: { message: body.message, source: body.source || 'hdm_portfolio', user_id: userId, data: body.data }
      };
    default:
      return {
        endpoint: `${module}/chat`,
        payload: { message: body.message, user_id: userId, data: body.data }
      };
  }
}

const streamChat = async (req, res, next) => {
  res.status(501).json({ success: false, error: 'Streaming not available for projects.' });
};

module.exports = { chat, streamChat, publicChat };