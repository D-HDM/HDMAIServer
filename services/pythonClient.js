const axios = require('axios');
const config = require('../config');

let useBackup = false;

const pythonClient = {
  getUrl() {
    if (!config.pythonAiUrlBackup) return config.pythonAiUrl;
    return useBackup ? config.pythonAiUrlBackup : config.pythonAiUrl;
  },

  getActiveUrl() {
    return this.getUrl();
  },

  toggleUrl() {
    if (config.pythonAiUrlBackup) {
      useBackup = !useBackup;
      console.log(`Python URL switched to: ${this.getUrl()}`);
    }
  },

  async post(endpoint, payload) {
    const url = this.getUrl();
    try {
      const response = await axios.post(`${url}/api/v1/${endpoint}`, payload, { timeout: 60000 });
      return response.data;
    } catch (error) {
      console.error(`Python call failed [${endpoint}]:`, error.message);
      if (config.pythonAiUrlBackup && !useBackup) {
        console.log('Retrying with backup URL...');
        this.toggleUrl();
        return this.post(endpoint, payload);
      }
      throw error;
    }
  },

  async chat({ messages, userId, module, provider, model, temperature, maxTokens, data }) {
    try {
      const response = await this.post(`${module}/chat`, {
        message: messages[messages.length - 1]?.content || '',
        messages,
        user_id: userId,
        provider,
        model,
        temperature,
        max_tokens: maxTokens,
        data,
      });
      const body = response?.data || response;
      return {
        success: true,
        reply: body.reply,
        model: body.model,
        tokensUsed: body.tokens_used || body.tokensUsed || 0,
        provider: body.provider,
      };
    } catch (error) {
      return { success: false, error: 'AI engine unavailable.' };
    }
  },

  async stream({ messages, userId, module, provider, model, temperature, maxTokens, data, onChunk }) {
    const url = this.getUrl();
    try {
      const response = await axios.post(
        `${url}/api/v1/${module}/chat/stream`,
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
              } catch (e) {}
            }
          }
        });
        response.data.on('end', () => resolve({ done: true }));
        response.data.on('error', reject);
      });
    } catch (error) {
      console.error(`Python stream failed [${module}]:`, error.message);
      if (config.pythonAiUrlBackup && !useBackup) {
        console.log('Retrying with backup URL...');
        this.toggleUrl();
        return this.stream({ messages, userId, module, provider, model, temperature, maxTokens, data, onChunk });
      }
      return { success: false, error: 'AI stream unavailable.' };
    }
  },

  async health() {
    try {
      const response = await axios.get(`${config.pythonAiUrl}/health`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      if (config.pythonAiUrlBackup) {
        try {
          const response = await axios.get(`${config.pythonAiUrlBackup}/health`, { timeout: 5000 });
          return response.data;
        } catch {}
      }
      return { status: 'unreachable' };
    }
  },
};

module.exports = pythonClient;