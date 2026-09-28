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
      const response = await axios.post(`${url}${endpoint}`, payload, { timeout: 60000 });
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