const axios = require('axios');
const config = require('../../config');
const usageService = require('../../services/usageService');

const proxyToPython = async (endpoint, body, module, res) => {
  try {
    const response = await axios.post(`${config.pythonAiUrl}/api/v1/rvnp/${endpoint}`, body, { timeout: 30000 });
    await usageService.log({ module, provider: 'groq', endpoint: `/rvnp/${endpoint}`, tokensUsed: 0, status: 'success' });
    res.json(response.data);
  } catch (err) {
    console.error(`RVNP ${endpoint} failed:`, err.message);
    await usageService.log({ module, provider: 'groq', endpoint: `/rvnp/${endpoint}`, tokensUsed: 0, status: 'error', errorMessage: err.message });
    res.status(500).json({ error: true, code: 'SERVER_ERROR', message: 'AI engine unavailable.' });
  }
};

const chat = async (req, res) => proxyToPython('chat', req.body, 'rvnp', res);
const moderate = async (req, res) => proxyToPython('moderate', req.body, 'rvnp', res);
const verifyDocument = async (req, res) => proxyToPython('verify-document', req.body, 'rvnp', res);
const rankFeed = async (req, res) => proxyToPython('rank-feed', req.body, 'rvnp', res);
const suggestReplies = async (req, res) => proxyToPython('suggest-replies', req.body, 'rvnp', res);
const trending = async (req, res) => proxyToPython('trending', req.body, 'rvnp', res);

module.exports = { chat, moderate, verifyDocument, rankFeed, suggestReplies, trending };