// ====================================================================================================
// HDM AI Server — Python AI Client
// ====================================================================================================

const axios = require('axios');
const config = require('../config');

const pythonClient = {
async chat({ messages, userId, module, provider, model, temperature, maxTokens, data }) {
  try {
    const response = await axios.post(
      `${config.pythonAiUrl}/api/v1/${module}/chat`,
      { message: messages[messages.length - 1]?.content || '', messages, user_id: userId, provider, model, temperature, max_tokens: maxTokens, data },
      { timeout: 60000 }
    );
    const body = response.data?.data || response.data;
    return {
      success: true,
      reply: body.reply,
      model: body.model,
      tokensUsed: body.tokens_used || body.tokensUsed || 0,
      provider: body.provider,
    };
  } catch (error) {
    console.error(`Python call failed [${module}]:`, error.message);
    return { success: false, error: 'AI engine unavailable.' };
  }
},

  async stream({ messages, userId, module, provider, model, temperature, maxTokens, data, onChunk }) {
    try {
      const response = await axios.post(
        `${config.pythonAiUrl}/api/v1/${module}/chat/stream`,
        { message: messages[messages.length - 1]?.content || '', messages, user_id: userId, provider, model, temperature, max_tokens: maxTokens, data },
        { responseType: 'stream', timeout: 120000 }
      );

      return new Promise((resolve, reject) => {
        let buffer = '';
        response.data.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.slice(6));
                if (json.done) resolve(json);
                else if (json.chunk && onChunk) onChunk(json.chunk);
              } catch (e) { /* skip bad JSON */ }
            }
          }
        });
        response.data.on('end', () => resolve({ done: true }));
        response.data.on('error', reject);
      });
    } catch (error) {
      console.error(`Python stream failed [${module}]:`, error.message);
      return { success: false, error: 'AI stream unavailable.' };
    }
  },

  async health() {
    try {
      const response = await axios.get(`${config.pythonAiUrl}/health`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      return { status: 'unreachable' };
    }
  },
};

module.exports = pythonClient;