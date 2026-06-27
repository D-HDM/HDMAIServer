// ====================================================================================================
// HDM Bridge — Email API Configuration & Connection
// ====================================================================================================

const axios = require('axios');

const HDM_BRIDGE = {
  apiKey: process.env.HDM_API_KEY,
  apiUrl: process.env.HDM_API_URL || 'https://api.hdmbridge.com/api',
  fromEmail: process.env.HDM_FROM_EMAIL || 'notifications@hdm.ai',
  fromName: process.env.HDM_FROM_NAME || 'HDM AI',

  /**
   * Test connection to HDM Bridge
   */
  async testConnection() {
    try {
      const response = await axios.get(`${this.apiUrl}/health`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: 5000,
      });
      console.log('HDM Bridge: CONNECTED');
      return true;
    } catch (error) {
      console.warn('HDM Bridge: UNAVAILABLE — email sending disabled');
      return false;
    }
  },

  /**
   * Send email — used by emailService
   */
  async send({ to, subject, htmlBody, textBody }) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/emails/send`,
        {
          from: this.fromEmail,
          fromName: this.fromName,
          to,
          subject,
          htmlBody,
          textBody,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      console.log(`Email sent: ${to} — "${subject}"`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Email failed: ${to} — ${error.message}`);
      return { success: false, error: error.message };
    }
  },
};

module.exports = HDM_BRIDGE;